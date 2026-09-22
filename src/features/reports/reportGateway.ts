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

/** Extrai a versão do artefato de `/output/v{versao}/{arquivo}`. */
export function extractVersionFromPdfUrl(pdfUrl: string): string | null {
  return /\/output\/v(\d+)\//.exec(pdfUrl)?.[1] ?? null;
}

/**
 * Looks for one ready report. When `arquivo` is given, matches by the exact file
 * name the backend named in the `X-Relatorio-Arquivo` response header instead of
 * city/macrotheme — the backend's own cache gate already decided the artifact is
 * fresh, and on a cache HIT the PDF is served without being rewritten, so its
 * mtime stays older than the click that asked for it (P1 regression). When
 * `versaoObsoleta` is also given, the entry's own version must differ from it:
 * once the backend can answer "still generating", a name-only match would find
 * last week's PDF and declare it ready with no error at all.
 * Example: `await findAvailableAutomaticReport(params, arquivo)`.
 */
export async function findAvailableAutomaticReport(
  params: URLSearchParams,
  arquivo: string | null = null,
  versaoObsoleta: string | null = null,
): Promise<AvailableAutomaticReport | null> {
  const city = requireCity(params);
  const slugs = parseAutomaticReportSlug(params.get("macrotema"));
  const reports = await fetchReportIndex();
  const report = reports.find((entry) => {
    if (!entry.pdf_url) return false;
    if (arquivo) {
      if (entry.arquivo_pdf !== arquivo) return false;
      if (!versaoObsoleta) return true;

      return extractVersionFromPdfUrl(entry.pdf_url) !== versaoObsoleta;
    }

    return (
      matchesReportCity(entry.cidade, city) &&
      entryMatchesAnyMacrotheme(entry.arquivo_pdf, slugs)
    );
  });
  if (!report) return null;

  return {
    fileName: report.arquivo_pdf,
    pdfUrl: new URL(report.pdf_url, getAutomaticReportApiBaseUrl()).toString(),
  };
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
  if (
    normalizeReportLabel(entryCity) === normalizeReportLabel(cityWithoutState)
  ) {
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
