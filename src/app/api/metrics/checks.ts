import { checkBoletimPdf } from "@/features/boletim/pdfSource";
import { ZENODO_HEADERS } from "@/lib/zenodo";
import { ZENODO_BASE_URL } from "@/utils/constants";
import { getContent, pingContentful } from "@/utils/contentful";
import { BOLETIM_LINKS_QUERY } from "@/utils/queries";

export interface CheckStatus {
  ok: boolean;
  latencyMs: number;

  /** Só a categoria da falha; a mensagem original fica no log do servidor. */
  error?: string;
}

export interface BoletimStatus extends CheckStatus {
  id: string;
  title: string;
}

export interface MetricsReport {
  dependencies: Record<string, CheckStatus>;
  boletins: BoletimStatus[];
}

type BoletimLink = { sys: { id: string }; title?: string; link?: string };
type BoletimLinksResponse = { postCollection: { items: BoletimLink[] } };

/** Bem abaixo dos 30 s que o Prometheus espera pela resposta. */
const CHECK_TIMEOUT_MS = 8_000;

/**
 * O boletim do Drive leva ~8,5 s até o primeiro byte (medido em 13/11/2026):
 * com 8 s ele virava alarme falso. Os boletins rodam em paralelo, então a coleta
 * continua abaixo dos 30 s.
 */
const BOLETIM_TIMEOUT_MS = 20_000;

/** Pedidos seguidos ao /api/metrics dividem a mesma verificação. */
const REPORT_TTL_MS = 30_000;

/**
 * Cada ida ao Contentful conta na cota de 100 mil por mês do space, que chegou a
 * 99% em 28/10/2026. A falha também fica guardada: com a cota estourada, testar
 * a cada minuto só gastaria mais. São 24 chamadas por dia, só em prod.
 */
const CONTENTFUL_TTL_MS = 60 * 60_000;
const ZENODO_OK_TTL_MS = 15 * 60_000;

/**
 * São 18 PDFs no gov.br (01/11/2026): a cada 15 min dá ~1,7 mil pedidos por dia,
 * só em prod, cada um lendo só os primeiros bytes.
 */
const BOLETINS_TTL_MS = 15 * 60_000;

class CheckFailure extends Error {}

const remembered = new Map<string, { value: unknown; until: number }>();
const lastOk = new Map<string, boolean>();
let cachedReport: { report: MetricsReport; until: number } | null = null;
let pendingReport: Promise<MetricsReport> | null = null;

function describeFailure(error: unknown): string {
  if (error instanceof CheckFailure) return error.message;
  if (error instanceof Error && error.name === "TimeoutError") return "timeout";

  return "failed";
}

// Uma linha por mudança de estado, e não uma por coleta: com o monitor chamando
// a cada minuto, uma dependência fora por horas afogaria o log.
function logTransition(check: string, ok: boolean, error?: unknown) {
  const previous = lastOk.get(check);
  lastOk.set(check, ok);
  if (previous === ok || (ok && previous === undefined)) return;

  const event = ok ? "metrics_check_recovered" : "metrics_check_failed";
  const message = error instanceof Error ? error.message : error;
  console[ok ? "info" : "error"](JSON.stringify({ event, check, message }));
}

async function measure(
  check: string,
  run: (signal: AbortSignal) => Promise<unknown>,
  timeoutMs = CHECK_TIMEOUT_MS,
): Promise<CheckStatus> {
  const startedAt = Date.now();
  try {
    await run(AbortSignal.timeout(timeoutMs));
    logTransition(check, true);

    return { ok: true, latencyMs: Date.now() - startedAt };
  } catch (error) {
    logTransition(check, false, error);
    const latencyMs = Date.now() - startedAt;

    return { ok: false, latencyMs, error: describeFailure(error) };
  }
}

async function remember<T>(
  key: string,
  ttlMs: number,
  run: () => Promise<T>,
  shouldKeep: (value: T) => boolean = () => true,
): Promise<T> {
  const hit = remembered.get(key);
  if (hit && hit.until > Date.now()) return hit.value as T;

  const value = await run();
  if (shouldKeep(value)) {
    remembered.set(key, { value, until: Date.now() + ttlMs });
  }

  return value;
}

function checkContentful(): Promise<CheckStatus> {
  return remember("contentful", CONTENTFUL_TTL_MS, () =>
    measure("contentful", (signal) => pingContentful(signal)),
  );
}

async function pingZenodo(signal: AbortSignal) {
  const url = `${ZENODO_BASE_URL}?communities=datane&size=1`;
  const response = await fetch(url, {
    headers: ZENODO_HEADERS,
    cache: "no-store",
    signal,
  });
  await response.body?.cancel();
  if (!response.ok) throw new CheckFailure(`HTTP ${response.status}`);
}

function checkZenodo(): Promise<CheckStatus> {
  const isOk = (status: CheckStatus) => status.ok;

  return remember(
    "zenodo",
    ZENODO_OK_TTL_MS,
    () => measure("zenodo", pingZenodo),
    isOk,
  );
}

async function checkBoletim({ sys, title, link }: BoletimLink) {
  const opensAsPdf = async (signal: AbortSignal) => {
    const reason = link ? await checkBoletimPdf(link, signal) : "sem_link";
    if (reason) throw new CheckFailure(reason);
  };
  const status = await measure(
    `boletim ${sys.id}`,
    opensAsPdf,
    BOLETIM_TIMEOUT_MS,
  );

  return { ...status, id: sys.id, title: title ?? "" };
}

async function checkBoletins() {
  let links: BoletimLink[] = [];

  // A lista vem do cache da tag `contentful`: só gasta cota depois de um
  // /atualizar-conteudo.
  const list = await measure("lista de boletins", async () => {
    const response =
      await getContent<BoletimLinksResponse>(BOLETIM_LINKS_QUERY);
    links = response.postCollection.items;
  });
  const boletins = await remember("boletins", BOLETINS_TTL_MS, () =>
    Promise.all(links.map(checkBoletim)),
  );

  return { list, boletins };
}

// IMPORTANT: só onde EXTERNAL_CHECKS=1 (prod). Contentful, Zenodo e os links dos
// boletins são os mesmos para prod e failover; testar nos dois só dobraria os
// pedidos ao gov.br e a cota do Contentful. No failover, o /api/metrics serve
// só para dizer que o site responde (o `up` do Prometheus).
function runsExternalChecks(): boolean {
  return process.env.EXTERNAL_CHECKS === "1";
}

async function runChecks(): Promise<MetricsReport> {
  if (!runsExternalChecks()) return { dependencies: {}, boletins: [] };

  const [contentful, zenodo, { list, boletins }] = await Promise.all([
    checkContentful(),
    checkZenodo(),
    checkBoletins(),
  ]);

  return {
    dependencies: { contentful, zenodo, lista_de_boletins: list },
    boletins,
  };
}

/**
 * O estado de cada dependência e de cada boletim, reaproveitando a última
 * verificação enquanto ela vale; pedidos simultâneos dividem a mesma.
 *
 * Usage: const { dependencies, boletins } = await getMetricsReport();
 */
export function getMetricsReport(): Promise<MetricsReport> {
  if (cachedReport && cachedReport.until > Date.now()) {
    return Promise.resolve(cachedReport.report);
  }

  pendingReport ??= runChecks()
    .then((report) => {
      cachedReport = { report, until: Date.now() + REPORT_TTL_MS };

      return report;
    })
    .finally(() => {
      pendingReport = null;
    });

  return pendingReport;
}

/** Existe para o teste começar cada caso sem verificação guardada. */
export function resetMetricsChecks() {
  remembered.clear();
  lastOk.clear();
  cachedReport = null;
  pendingReport = null;
}
