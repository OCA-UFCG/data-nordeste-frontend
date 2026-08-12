export type AutomaticReportMacrothemeSlug =
  | "demografia"
  | "desenvolvimento-social"
  | "educacao"
  | "meio-ambiente"
  | "saude"
  | "economia-renda"
  | "saneamento"
  | "hidraulica"
  | "todos";

export type AutomaticReportRequest = {
  city: string;
  macrotheme: string;
  geradoApos?: string;
};

const AUTOMATIC_REPORT_SLUGS = new Set<AutomaticReportMacrothemeSlug>([
  "demografia",
  "desenvolvimento-social",
  "educacao",
  "meio-ambiente",
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
  desenvolvimento_social: "desenvolvimento-social",
  educacao: "educacao",
  meio_ambiente: "meio-ambiente",
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

export function buildReportProxyUrl(request: AutomaticReportRequest): string {
  const params = new URLSearchParams({
    city: request.city,
    macrotema: request.macrotheme,
    _: Date.now().toString(),
  });
  if (request.geradoApos) {
    params.set("gerado_apos", request.geradoApos);
  }

  return `/api/reports/generate?${params.toString()}`;
}

/** Creates a stable download name. Example: `buildReportFileName("São Luís (MA)")` => `relatorio_sao_luis_ma.pdf`. */
export function buildReportFileName(city: string): string {
  const citySlug = city
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "_")
    .replaceAll(/^_+|_+$/g, "");
  if (!citySlug) {
    throw new Error(
      `Invalid report city "${city}"; expected a name containing letters or numbers.`,
    );
  }

  return `relatorio_${citySlug}.pdf`;
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
