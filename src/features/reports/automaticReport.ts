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

/** Builds the public report-service URL. Example: `buildAutomaticReportUrl({ city, macrotheme })`. */
export function buildAutomaticReportUrl(
  request: AutomaticReportRequest,
): string {
  const params = new URLSearchParams({
    macrotema: request.macrotheme,
    _: Date.now().toString(),
  });
  const baseUrl = (
    process.env.NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL ?? ""
  ).replace(/\/+$/, "");

  // IMPORTANT: Production routes /relatorio to Automatic-Reporting at the
  // public origin. Local development sets a public base URL because Next and
  // FastAPI listen on different ports.
  return `${baseUrl}/relatorio/${encodeURIComponent(request.city)}?${params.toString()}`;
}

export function getAutomaticReportApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL;
  if (baseUrl) return baseUrl.replace(/\/+$/, "");

  throw new Error(
    'Invalid NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL ""; expected an absolute URL like "http://127.0.0.1:8000".',
  );
}
