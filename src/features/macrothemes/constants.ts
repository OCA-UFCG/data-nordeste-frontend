export const MACROTHEME_ICON_BY_ID: { [key: string]: string } = {
  economia_e_renda: "money",
  demografia: "user",
  desenvolvimento_social: "social-development",
  saude: "health",
  educacao: "book",
  infraestrutura_e_saneamento: "screwdriver",
  seguranca_hidrica: "drop",
  meio_ambiente: "leaf",
  instrumentos_sudene: "instruments",
  cultura: "culture",
};

export const THEMES_NAVIGATION_ORDER = [
  "ver_todos",
  "demografia",
  "educacao",
  "saude",
  "economia_e_renda",
  "infraestrutura_e_saneamento",
  "desenvolvimento_social",
  "seguranca_hidrica",
  "meio_ambiente",
  "instrumentos_sudene",
  "cultura",
];

export const MACROTHEME_ROUTE_BY_NAME = {
  "Economia e Renda": "economia-e-renda",
  "Demografia": "demografia",
  "Desenvolvimento Social": "desenvolvimento-social",
  "Saúde": "saude",
  "Educação": "educacao",
  "Infraestrutura e Saneamento": "infraestrutura-e-saneamento",
  "Segurança Hídrica": "seguranca-hidrica",
  "Meio Ambiente": "meio-ambiente",
  "Instrumentos da Sudene": "instrumentos-sudene",
  "Cultura": "cultura",
};

// INTENTIONAL: SUDENE asked for Cultura without the Análises tab (Nov 2026).
// Every other macrotheme keeps the tab visible even while it is still empty.
export const MACROTHEMES_WITHOUT_ANALYSES_TAB = ["cultura"];

/**
 * Tells whether the macrotheme page shows the Análises tab, by Contentful id.
 * Example: `hasAnalysesTab("cultura")` → `false`; `hasAnalysesTab("saude")` → `true`.
 */
export const hasAnalysesTab = (themeId: string): boolean =>
  !MACROTHEMES_WITHOUT_ANALYSES_TAB.includes(themeId);
