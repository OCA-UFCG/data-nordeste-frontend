import {
  getAutomaticReportApiBaseUrl,
  joinReportSlugs,
  parseAutomaticReportSlug,
} from "@/features/reports/automaticReport";

type AutomaticReportEntry = {
  arquivo_pdf: string;
  cidade: string;
  macrotema: string;
  pdf_url: string;
  last_modified_utc?: string;
};

export type AvailableAutomaticReport = {
  fileName: string;
  pdfUrl: string;
};

/** Builds the backend generation URL. Example: `buildAutomaticReportGenerationUrl(params)`. */
export function buildAutomaticReportGenerationUrl(
  params: URLSearchParams,
): string {
  const city = requireCity(params);
  const slugs = parseAutomaticReportSlug(params.get("macrotema"));
  const url = new URL(
    `/relatorio/${encodeURIComponent(city)}`,
    getAutomaticReportApiBaseUrl(),
  );

  // PERF: The backend accepts a comma-separated list in a single `macrotema`
  // query param. Keeping the legacy single-value shape avoids a new contract
  // while letting users request several macrothemes in one shot.
  url.searchParams.set("macrotema", joinReportSlugs(slugs));

  // O portal nunca lê o corpo desta resposta: ele descobre o artefato pronto
  // pelo índice de /relatorios. Segurar a conexão por até 46s só produzia timeout.
  url.searchParams.set("aguardar", "nao");

  return url.toString();
}

/** Extrai a versão do artefato de `/output/v{versao}/{arquivo}`. */
export function extractVersionFromPdfUrl(pdfUrl: string): string | null {
  return /\/output\/v(\d+)\//.exec(pdfUrl)?.[1] ?? null;
}

/**
 * Looks for one ready report, matched by the exact file name the backend named
 * in the `X-Relatorio-Arquivo` response header — the backend's own cache gate
 * already decided the artifact is fresh, and on a cache HIT the PDF is served
 * without being rewritten, so its mtime stays older than the click that asked
 * for it (P1 regression). When `versaoObsoleta` is also given, the entry's own
 * version must differ from it: once the backend can answer "still generating",
 * a name-only match would find last week's PDF and declare it ready with no
 * error at all.
 * Example: `await findAvailableAutomaticReport(arquivo, versaoObsoleta)`.
 */
export async function findAvailableAutomaticReport(
  arquivo: string | null,
  versaoObsoleta: string | null = null,
): Promise<AvailableAutomaticReport | null> {
  if (!arquivo) {
    throw new Error(
      'Invalid arquivo ""; expected the artifact name from the backend.',
    );
  }

  const reports = await fetchReportIndex();
  const report = reports.find((entry) => {
    if (!entry.pdf_url) return false;
    if (entry.arquivo_pdf !== arquivo) return false;
    if (!versaoObsoleta) return true;

    return extractVersionFromPdfUrl(entry.pdf_url) !== versaoObsoleta;
  });
  if (!report) return null;

  return {
    fileName: report.arquivo_pdf,
    pdfUrl: new URL(report.pdf_url, getAutomaticReportApiBaseUrl()).toString(),
  };
}

function requireCity(params: URLSearchParams): string {
  const city = params.get("city")?.trim();
  if (city) return city;

  throw new Error('Invalid city ""; expected a non-empty municipality name.');
}

async function fetchReportIndex(): Promise<AutomaticReportEntry[]> {
  const response = await fetch(`${getAutomaticReportApiBaseUrl()}/relatorios`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      `Automatic report index returned ${response.status}; expected 200.`,
    );
  }

  return (await response.json()) as AutomaticReportEntry[];
}
