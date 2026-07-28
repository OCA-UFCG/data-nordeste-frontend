import {
  getAutomaticReportApiBaseUrl,
  parseAutomaticReportSlug,
} from "@/features/reports/automaticReport";

type AutomaticReportEntry = {
  arquivo_pdf: string;
  cidade: string;
  macrotema: string;
  pdf_url: string;
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
  const macrotheme = parseAutomaticReportSlug(params.get("macrotema"));
  const url = new URL(
    `/relatorio/${encodeURIComponent(city)}`,
    getAutomaticReportApiBaseUrl(),
  );
  url.searchParams.set("macrotema", macrotheme);

  return url.toString();
}

/** Looks for one ready report without polling. Example: `await findAvailableAutomaticReport(params)`. */
export async function findAvailableAutomaticReport(
  params: URLSearchParams,
): Promise<AvailableAutomaticReport | null> {
  const city = requireCity(params);
  const macrotheme = parseAutomaticReportSlug(params.get("macrotema"));
  const reports = await fetchReportIndex();
  const report = reports.find(
    (entry) =>
      Boolean(entry.pdf_url) &&
      matchesReportCity(entry.cidade, city) &&
      normalizeReportLabel(entry.arquivo_pdf).includes(
        normalizeReportLabel(macrotheme),
      ),
  );
  if (!report) return null;

  return {
    fileName: report.arquivo_pdf,
    pdfUrl: new URL(
      report.pdf_url,
      getAutomaticReportApiBaseUrl(),
    ).toString(),
  };
}

function matchesReportCity(entryCity: string, requestedCity: string): boolean {
  if (normalizeReportLabel(entryCity) === normalizeReportLabel(requestedCity)) {
    return true;
  }

  // LEGACY: Automatic-Reporting used to replace accented characters with "_"
  // in filenames. Keep matching "Bel M Al" to "Belém (AL)" until old PDFs
  // have been regenerated with accent-aware slugs.
  return (
    normalizeReportLabel(entryCity) ===
    normalizeLegacyReportLabel(requestedCity)
  );
}

function requireCity(params: URLSearchParams): string {
  const city = params.get("city")?.trim();
  if (city) return city;

  throw new Error('Invalid city ""; expected a non-empty municipality name.');
}

async function fetchReportIndex(): Promise<AutomaticReportEntry[]> {
  const response = await fetch(
    `${getAutomaticReportApiBaseUrl()}/relatorios`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error(
      `Automatic report index returned ${response.status}; expected 200.`,
    );
  }

  return (await response.json()) as AutomaticReportEntry[];
}

function normalizeLegacyReportLabel(value: string): string {
  return value
    .replaceAll(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function normalizeReportLabel(value: string): string {
  return value
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}
