export type AutomaticReportMacrothemeSlug =
  | "demografia"
  | "educacao"
  | "saude"
  | "economia-renda"
  | "saneamento"
  | "hidraulica"
  | "todos";

export type AutomaticReportRequest = {
  city: string;
  macrotheme: string;
};

const AUTOMATIC_REPORT_SLUGS = new Set<AutomaticReportMacrothemeSlug>([
  "demografia",
  "educacao",
  "saude",
  "economia-renda",
  "saneamento",
  "hidraulica",
  "todos",
]);

const REPORT_SLUG_BY_THEME_ID: {
  [themeId: string]: AutomaticReportMacrothemeSlug;
} = {
  demografia: "demografia",
  educacao: "educacao",
  saude: "saude",
  economia_e_renda: "economia-renda",
  infraestrutura_e_saneamento: "saneamento",
  seguranca_hidrica: "hidraulica",
};

/** Maps a Data Nordeste macrotheme id to the report API slug. Example: `getAutomaticReportSlug("seguranca_hidrica")`. */
export function getAutomaticReportSlug(
  themeId: string,
): AutomaticReportMacrothemeSlug | null {
  return REPORT_SLUG_BY_THEME_ID[themeId] ?? null;
}

/** Validates one or more comma-separated report slugs. Example: `parseAutomaticReportSlug("saude,demografia")`. */
export function parseAutomaticReportSlug(
  value: string | null,
): AutomaticReportMacrothemeSlug[] {
  if (!value) {
    throw new Error(
      `Invalid macrotheme "${value}"; expected one or more of ${Array.from(AUTOMATIC_REPORT_SLUGS).join(", ")}.`,
    );
  }

  const slugs = value
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
  if (slugs.length === 0) {
    throw new Error(
      `Invalid macrotheme "${value}"; expected at least one of ${Array.from(AUTOMATIC_REPORT_SLUGS).join(", ")}.`,
    );
  }

  const invalid = slugs.filter(
    (slug) =>
      !AUTOMATIC_REPORT_SLUGS.has(slug as AutomaticReportMacrothemeSlug),
  );
  if (invalid.length > 0) {
    throw new Error(
      `Invalid macrotheme "${value}"; expected only entries from ${Array.from(AUTOMATIC_REPORT_SLUGS).join(", ")}.`,
    );
  }

  return slugs as AutomaticReportMacrothemeSlug[];
}

/** Joins macrotheme slugs into the comma-separated wire format. Example: `joinReportSlugs(["saude","demografia"])` => `"saude,demografia"`. */
export function joinReportSlugs(
  slugs: AutomaticReportMacrothemeSlug[],
): string {
  return slugs.join(",");
}

/**
 * Builds the public Next proxy URL for a generated report PDF.
 *
 * Example: `buildReportProxyUrl({ city, macrotheme: "saude,demografia" })` =>
 * `/api/reports/generate?city=Recife%20(PE)&macrotema=saude%2Cdemografia&_=1721600000000`.
 */
export function buildReportProxyUrl(request: AutomaticReportRequest): string {
  const params = new URLSearchParams({
    city: request.city,
    macrotema: request.macrotheme,
    _: Date.now().toString(),
  });

  return `/api/reports/generate?${params.toString()}`;
}

export function getAutomaticReportApiBaseUrl(): string {
  const baseUrl =
    process.env.AUTOMATIC_REPORT_API_URL ??
    process.env.NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL;
  if (baseUrl) return baseUrl.replace(/\/+$/, "");

  throw new Error(
    'Invalid AUTOMATIC_REPORT_API_URL ""; expected an absolute URL like "http://127.0.0.1:8000".',
  );
}
