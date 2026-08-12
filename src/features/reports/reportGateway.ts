import {
  getAutomaticReportApiBaseUrl,
  joinReportSlugs,
  parseAutomaticReportSlug,
  type AutomaticReportMacrothemeSlug,
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

  return url.toString();
}

/** Looks for one ready report without polling. Example: `await findAvailableAutomaticReport(params)`. */
export async function findAvailableAutomaticReport(
  params: URLSearchParams,
  geradoApos: string | null = null,
): Promise<AvailableAutomaticReport | null> {
  const city = requireCity(params);
  const slugs = parseAutomaticReportSlug(params.get("macrotema"));
  const reports = await fetchReportIndex();
  const minGeneratedAt = geradoApos ? Date.parse(geradoApos) : null;
  const report = reports.find(
    (entry) =>
      Boolean(entry.pdf_url) &&
      wasGeneratedAfter(entry, minGeneratedAt) &&
      matchesReportCity(entry.cidade, city) &&
      entryMatchesAnyMacrotheme(entry.arquivo_pdf, slugs),
  );
  if (!report) return null;

  return {
    fileName: report.arquivo_pdf,
    pdfUrl: new URL(report.pdf_url, getAutomaticReportApiBaseUrl()).toString(),
  };
}

function wasGeneratedAfter(
  entry: AutomaticReportEntry,
  minGeneratedAt: number | null,
): boolean {
  if (minGeneratedAt === null) return true;
  if (!entry.last_modified_utc) return false;
  const entryTime = Date.parse(entry.last_modified_utc);
  if (Number.isNaN(entryTime)) return false;

  return entryTime >= minGeneratedAt;
}

/**
 * Matches a report filename against any of the requested macrotheme slugs.
 * The backend writes one PDF per macrotheme per city, so "any match" returns
 * the first ready one. This is intentional: when multiple themes are selected,
 * the client polls for whichever becomes available first.
 */
function entryMatchesAnyMacrotheme(
  fileName: string,
  slugs: AutomaticReportMacrothemeSlug[],
): boolean {
  const normalizedFileName = normalizeReportLabel(fileName);

  return slugs.some((slug) =>
    normalizedFileName.includes(normalizeReportLabel(slug)),
  );
}

function matchesReportCity(entryCity: string, requestedCity: string): boolean {
  if (normalizeReportLabel(entryCity) === normalizeReportLabel(requestedCity)) {
    return true;
  }
  if (
    normalizeReportLabel(entryCity) ===
    normalizeLegacyReportLabel(requestedCity)
  ) {
    return true;
  }

  const cityWithoutState = removeStateSuffix(requestedCity);
  if (normalizeReportLabel(entryCity) === normalizeReportLabel(cityWithoutState)) {
    return true;
  }

  // LEGACY: Automatic-Reporting used to replace accented characters with "_"
  // in filenames. Keep matching "Bel M Al" to "Belém (AL)" until old PDFs
  // have been regenerated with accent-aware slugs.
  return (
    normalizeReportLabel(entryCity) ===
    normalizeLegacyReportLabel(cityWithoutState)
  );
}

function removeStateSuffix(city: string): string {
  // LEGACY: `/cities` includes the state, but `/relatorios` derives `cidade`
  // from filenames that contain only the municipality name.
  return city.replace(/\s+\([A-Z]{2}\)\s*$/, "").trim();
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

function normalizeLegacyReportLabel(value: string): string {
  return value.replaceAll(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function normalizeReportLabel(value: string): string {
  return value
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}
