import { mapWithLimit } from "./mapWithLimit";

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
  dependencies: { [dependency: string]: CheckStatus };
  boletins: BoletimStatus[];
}

export interface MetricsLogEntry {
  event: string;
  check?: string;
  message?: string;
  count?: number;
  limit?: number;
}

export type MetricsLogger = (
  level: "info" | "warn" | "error",
  entry: MetricsLogEntry,
) => void;

export interface MetricsCheckerDeps {
  pingContentful: (signal: AbortSignal) => Promise<unknown>;

  /** O status HTTP da consulta do catálogo no Zenodo. */
  pingZenodo: (signal: AbortSignal) => Promise<number>;

  /** Os itens crus da lista de boletins; os inválidos são descartados aqui. */
  getBoletimLinks: (signal: AbortSignal) => Promise<readonly unknown[]>;

  /** Por que o link não abre como PDF, ou null quando abre. */
  checkBoletimPdf: (
    link: string,
    signal: AbortSignal,
  ) => Promise<string | null>;
  runsExternalChecks: () => boolean;

  /** O `limit` da consulta da lista: uma lista desse tamanho pode estar cortada. */
  boletimListLimit: number;
  now?: () => number;
  timeoutSignal?: (ms: number) => AbortSignal;
  log?: MetricsLogger;
}

/** Bem abaixo dos 55 s (scrape_timeout em prometheus-datane.yml) que o Prometheus espera. */
const CHECK_TIMEOUT_MS = 8_000;

/**
 * O boletim do Drive leva ~8,5 s até o primeiro byte (medido em 13/11/2026):
 * com 8 s ele virava alarme falso. A lista (até 8 s) vem antes, e com 10 por vez
 * 18 boletins são 2 levas: no pior caso (todos no limite) são 8 + 2 × 20 = 48 s,
 * dentro dos 55 s do Prometheus. Passando de 20 boletins seriam 3 levas e o pior
 * caso estoura; a verificação termina sozinha e fica guardada, então só uma
 * coleta, durante uma queda do gov.br, se perde.
 */
const BOLETIM_TIMEOUT_MS = 20_000;

/** O gov.br pode tratar dezenas de pedidos de uma vez como abuso (429/WAF). */
const BOLETIM_CONCURRENCY = 10;

/** Pedidos seguidos ao /api/metrics dividem a mesma verificação. */
const REPORT_TTL_MS = 30_000;

/**
 * Cada ida ao Contentful conta na cota de 100 mil por mês do space, que chegou a
 * 99% em 28/10/2026. Com ele bom, são 24 chamadas por dia, só em prod. A falha
 * também fica guardada, por menos tempo: testar a cada minuto com a cota estourada
 * só gastaria mais, mas uma hora inteira de alarme por um timeout solto é demais.
 * Numa queda longa, o ping faz no máximo 144 chamadas por dia (a lista, abaixo,
 * pode fazer mais 288).
 */
const CONTENTFUL_OK_TTL_MS = 60 * 60_000;
const CONTENTFUL_FAILURE_TTL_MS = 10 * 60_000;
const ZENODO_OK_TTL_MS = 15 * 60_000;

/**
 * São 18 PDFs no gov.br (01/11/2026): a cada 15 min dá ~1,7 mil pedidos por dia,
 * só em prod, cada um lendo só os primeiros bytes.
 */
const BOLETINS_TTL_MS = 15 * 60_000;

/**
 * Falha na lista: o cache de dados do Next só guarda sucesso, então sem isto cada
 * coleta (1 por minuto) faria um POST ao Contentful justo quando ele falha: assim
 * são até 288 por dia. Curto, para os boletins voltarem logo depois que a lista
 * volta. Enquanto ela falha, as séries datane_boletim_* não saem no relatório; a
 * falha aparece em datane_dependency_up{dependency="lista_de_boletins"}.
 */
const LIST_FAILURE_TTL_MS = 5 * 60_000;

class CheckFailure extends Error {}

interface BoletimLink {
  id: string;
  title: string;
  link: string;
}

interface BoletinsSnapshot {
  list: CheckStatus;
  boletins: BoletimStatus[];
}

type RawBoletim = {
  sys?: { id?: unknown };
  title?: unknown;
  link?: unknown;
} | null;

function toBoletimLink(item: unknown): BoletimLink | null {
  const raw = item as RawBoletim;
  const id = raw?.sys?.id;
  if (typeof id !== "string" || id === "") return null;

  return {
    id,
    title: typeof raw?.title === "string" ? raw.title : "",
    link: typeof raw?.link === "string" ? raw.link : "",
  };
}

function describeFailure(error: unknown): string {
  if (error instanceof CheckFailure) return error.message;
  if (error instanceof Error && error.name === "TimeoutError") return "timeout";

  return "failed";
}

function errorMessage(error: unknown): string | undefined {
  if (error === undefined) return undefined;

  return error instanceof Error ? error.message : String(error);
}

const logToConsole: MetricsLogger = (level, entry) => {
  console[level](JSON.stringify(entry));
};

class MetricsChecker {
  private readonly memory = new Map<
    string,
    { value: unknown; until: number }
  >();
  private readonly lastOk = new Map<string, boolean>();
  private cachedReport: { report: MetricsReport; until: number } | null = null;
  private pendingReport: Promise<MetricsReport> | null = null;
  private readonly now: () => number;
  private readonly timeoutSignal: (ms: number) => AbortSignal;
  private readonly log: MetricsLogger;

  constructor(private readonly deps: MetricsCheckerDeps) {
    this.now = deps.now ?? Date.now;
    this.timeoutSignal =
      deps.timeoutSignal ?? ((ms) => AbortSignal.timeout(ms));
    this.log = deps.log ?? logToConsole;
  }

  getMetricsReport(): Promise<MetricsReport> {
    if (this.cachedReport && this.cachedReport.until > this.now()) {
      return Promise.resolve(this.cachedReport.report);
    }

    this.pendingReport ??= this.runChecks()
      .then((report) => {
        this.cachedReport = { report, until: this.now() + REPORT_TTL_MS };

        return report;
      })
      .finally(() => {
        this.pendingReport = null;
      });

    return this.pendingReport;
  }

  private async runChecks(): Promise<MetricsReport> {
    if (!this.deps.runsExternalChecks())
      return { dependencies: {}, boletins: [] };

    const [contentful, zenodo, { list, boletins }] = await Promise.all([
      this.checkContentful(),
      this.checkZenodo(),
      this.checkBoletins(),
    ]);

    return {
      dependencies: { contentful, zenodo, lista_de_boletins: list },
      boletins,
    };
  }

  // Uma linha por mudança de estado, e não uma por coleta: com o monitor chamando
  // a cada minuto, uma dependência fora por horas afogaria o log.
  private logTransition(check: string, ok: boolean, error?: unknown) {
    const previous = this.lastOk.get(check);
    this.lastOk.set(check, ok);
    if (previous === ok || (ok && previous === undefined)) return;

    const event = ok ? "metrics_check_recovered" : "metrics_check_failed";
    this.log(ok ? "info" : "error", {
      event,
      check,
      message: errorMessage(error),
    });
  }

  private async measure(
    check: string,
    run: (signal: AbortSignal) => Promise<unknown>,
    timeoutMs = CHECK_TIMEOUT_MS,
  ): Promise<CheckStatus> {
    const startedAt = this.now();
    try {
      await run(this.timeoutSignal(timeoutMs));
      this.logTransition(check, true);

      return { ok: true, latencyMs: this.now() - startedAt };
    } catch (error) {
      this.logTransition(check, false, error);
      const latencyMs = this.now() - startedAt;

      return { ok: false, latencyMs, error: describeFailure(error) };
    }
  }

  // `ttlFor` devolve 0 para não guardar o resultado.
  private async remember<T>(
    key: string,
    ttlFor: (value: T) => number,
    run: () => Promise<T>,
  ): Promise<T> {
    const hit = this.memory.get(key);
    if (hit && hit.until > this.now()) return hit.value as T;

    const value = await run();
    const ttlMs = ttlFor(value);
    if (ttlMs > 0) this.memory.set(key, { value, until: this.now() + ttlMs });

    return value;
  }

  private checkContentful(): Promise<CheckStatus> {
    return this.remember(
      "contentful",
      (status) =>
        status.ok ? CONTENTFUL_OK_TTL_MS : CONTENTFUL_FAILURE_TTL_MS,
      () => this.measure("contentful", this.deps.pingContentful),
    );
  }

  private checkZenodo(): Promise<CheckStatus> {
    const answers = async (signal: AbortSignal) => {
      const status = await this.deps.pingZenodo(signal);
      if (status < 200 || status >= 300)
        throw new CheckFailure(`HTTP ${status}`);
    };

    return this.remember(
      "zenodo",
      (status) => (status.ok ? ZENODO_OK_TTL_MS : 0),
      () => this.measure("zenodo", answers),
    );
  }

  private async checkBoletim({
    id,
    title,
    link,
  }: BoletimLink): Promise<BoletimStatus> {
    const opensAsPdf = async (signal: AbortSignal) => {
      const reason = link
        ? await this.deps.checkBoletimPdf(link, signal)
        : "sem_link";
      if (reason) throw new CheckFailure(reason);
    };
    const status = await this.measure(
      `boletim ${id}`,
      opensAsPdf,
      BOLETIM_TIMEOUT_MS,
    );

    return { ...status, id, title };
  }

  // Um item ruim da lista não derruba o relatório: é descartado e fica no log.
  private validLinks(items: readonly unknown[]): BoletimLink[] {
    const links = items.flatMap((item) => toBoletimLink(item) ?? []);
    const { boletimListLimit: limit } = this.deps;
    const skipped = items.length - links.length;
    if (skipped > 0) {
      this.log("warn", {
        event: "metrics_boletim_items_invalid",
        count: skipped,
      });
    }
    if (items.length >= limit) {
      this.log("warn", { event: "metrics_boletim_list_truncated", limit });
    }

    return links;
  }

  private async loadBoletins(): Promise<BoletinsSnapshot> {
    let items: readonly unknown[] = [];

    // A lista vem do cache da tag `contentful`: só gasta cota depois de um
    // /atualizar-conteudo.
    const list = await this.measure("lista de boletins", async (signal) => {
      const received = await this.deps.getBoletimLinks(signal);
      if (!Array.isArray(received)) throw new CheckFailure("lista_invalida");
      items = received;
    });
    const links = this.validLinks(items);
    const boletins = await mapWithLimit(links, BOLETIM_CONCURRENCY, (link) =>
      this.checkBoletim(link),
    );

    return { list, boletins };
  }

  // IMPORTANT: a lista entra no que é guardado. Guardar só os boletins fazia uma
  // falha na lista virar `[]` por 15 min, e sem série `datane_boletim_up` o alerta
  // não tem o que disparar.
  private checkBoletins(): Promise<BoletinsSnapshot> {
    return this.remember(
      "boletins",
      ({ list }) => (list.ok ? BOLETINS_TTL_MS : LIST_FAILURE_TTL_MS),
      () => this.loadBoletins(),
    );
  }
}

/**
 * O estado de cada dependência e de cada boletim, reaproveitando a última
 * verificação enquanto ela vale; pedidos simultâneos dividem a mesma. O estado
 * (caches, últimas falhas) fica dentro de cada instância.
 *
 * Usage: const { getMetricsReport } = createMetricsChecker({ pingContentful, ... });
 *        const { dependencies, boletins } = await getMetricsReport();
 */
export function createMetricsChecker(deps: MetricsCheckerDeps) {
  const checker = new MetricsChecker(deps);

  return { getMetricsReport: () => checker.getMetricsReport() };
}
