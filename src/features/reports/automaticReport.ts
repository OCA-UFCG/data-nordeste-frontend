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
  macrotheme: AutomaticReportMacrothemeSlug;
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

/** Validates report slugs accepted by Automatic-Reporting. Example: `parseAutomaticReportSlug("saude")`. */
export function parseAutomaticReportSlug(
  value: string | null,
): AutomaticReportMacrothemeSlug {
  if (
    value &&
    AUTOMATIC_REPORT_SLUGS.has(value as AutomaticReportMacrothemeSlug)
  ) {
    return value as AutomaticReportMacrothemeSlug;
  }

  throw new Error(
    `Invalid macrotheme "${value}"; expected one of ${Array.from(AUTOMATIC_REPORT_SLUGS).join(", ")}.`,
  );
}

/** Builds the public Next proxy URL for a generated report. Example: `buildReportProxyUrl({ city, macrotheme })`. */
export function buildReportProxyUrl(request: AutomaticReportRequest): string {
  const params = new URLSearchParams({
    city: request.city,
    macrotema: request.macrotheme,
  });

  return `/api/reports/generate?${params.toString()}`;
}

export function getAutomaticReportApiBaseUrl(): string {
  const baseUrl = process.env.AUTOMATIC_REPORT_API_URL;
  if (baseUrl) return baseUrl.replace(/\/+$/, "");

  throw new Error(
    'Invalid AUTOMATIC_REPORT_API_URL ""; expected an absolute URL like "http://127.0.0.1:8000".',
  );
}
