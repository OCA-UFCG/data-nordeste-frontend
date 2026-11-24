// Cliente do POST /docs/atualizar do Automatic-Reporting: confere os Google Docs
// editoriais dos relatórios e grava no cache do serviço só os que passaram. A
// regra vive lá (services/atualizacao_docs.py); aqui só chamamos e traduzimos a
// resposta para a tela de /atualizar-conteudo.

export type ReportDocStatus = "atualizado" | "com_problema" | "falhou";

export type ReportDocResult = {
  label: string;
  status: ReportDocStatus;
  warnings: string[];
};

export type ReportDocsRefreshOutcome =
  | { kind: "concluido"; docs: ReportDocResult[] }
  | { kind: "senha-incorreta" }
  | { kind: "indisponivel" }
  | { kind: "em-andamento" }
  | { kind: "erro"; message: string };

export type ReportDocsSummary = { updated: number; blocked: number };

export const REPORT_DOCS_TOKEN_HEADER = "X-Docs-Token";

// ~28 Docs baixados em paralelo levam ~1-2 s; 60 s cobre o Google lento sem
// deixar a tela presa para sempre se o serviço travar.
const REFRESH_TIMEOUT_MS = 60_000;

const REPORT_DOC_STATUSES = new Set<string>([
  "atualizado",
  "com_problema",
  "falhou",
]);

type ReportDocPayload = {
  rotulo: string;
  estado: ReportDocStatus;
  avisos: string[];
};

type RefreshReportDocsOptions = {
  apiBaseUrl: string;
  token: string;
  fetcher?: typeof fetch;
};

const isReportDocPayload = (value: unknown): value is ReportDocPayload => {
  if (typeof value !== "object" || value === null) return false;
  const doc = value as { [key: string]: unknown };

  return (
    typeof doc.rotulo === "string" &&
    typeof doc.estado === "string" &&
    REPORT_DOC_STATUSES.has(doc.estado) &&
    Array.isArray(doc.avisos) &&
    doc.avisos.every((warning) => typeof warning === "string")
  );
};

/** Valida o corpo de POST /docs/atualizar. Ex.: `parseReportDocs(await response.json())`. */
export function parseReportDocs(body: unknown): ReportDocResult[] {
  const docs = (body as { docs?: unknown } | null)?.docs;

  if (!Array.isArray(docs) || !docs.every(isReportDocPayload)) {
    throw new Error(
      `Invalid /docs/atualizar body ${JSON.stringify(body)}; expected { docs: [{ rotulo, estado, avisos }] }.`,
    );
  }

  return docs.map(({ rotulo, estado, avisos }) => ({
    label: rotulo,
    status: estado,
    warnings: avisos,
  }));
}

const outcomeFromResponse = async (
  response: Response,
): Promise<ReportDocsRefreshOutcome> => {
  if (response.ok) {
    return { kind: "concluido", docs: parseReportDocs(await response.json()) };
  }
  if (response.status === 409) return { kind: "em-andamento" };
  if (response.status === 503) return { kind: "indisponivel" };

  // 401: o DOCS_ATUALIZAR_TOKEN do portal e o do serviço não batem.
  return {
    kind: "erro",
    message: `O serviço de relatórios respondeu ${response.status}.`,
  };
};

/**
 * Pede ao Automatic-Reporting que confira e atualize os Docs dos relatórios.
 * Nunca lança: erro de rede ou resposta inesperada vira `{ kind: "erro" }`.
 *
 * Ex.: `await refreshReportDocs({ apiBaseUrl: getAutomaticReportApiBaseUrl(), token })`
 */
export async function refreshReportDocs({
  apiBaseUrl,
  token,
  fetcher = fetch,
}: RefreshReportDocsOptions): Promise<ReportDocsRefreshOutcome> {
  try {
    const response = await fetcher(`${apiBaseUrl}/docs/atualizar`, {
      method: "POST",
      headers: { [REPORT_DOCS_TOKEN_HEADER]: token },
      cache: "no-store",
      signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS),
    });

    return await outcomeFromResponse(response);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "report_docs_refresh_failed",
        apiBaseUrl,
        error: String(error),
      }),
    );

    return {
      kind: "erro",
      message: "Não foi possível falar com o serviço de relatórios.",
    };
  }
}

/** Conta atualizados e barrados. Ex.: `summarizeReportDocs(outcome.docs).blocked`. */
export function summarizeReportDocs(
  docs: ReportDocResult[],
): ReportDocsSummary {
  const updated = docs.filter((doc) => doc.status === "atualizado").length;

  return { updated, blocked: docs.length - updated };
}
