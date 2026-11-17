// Fora do módulo "use client": a página server também usa no estado de erro.
export const PIB_TITLE = "Produto Interno Bruto (PIB)";

// Texto do rodapé do painel, o mesmo do Power BI.
export const PIB_SOURCE =
  "Fonte dos dados: Instituto Brasileiro de Geografia e Estatística (IBGE) e Secretaria do Tesouro Nacional (STN) – Finanças do Brasil (FINBRA) e Sistema de Informações Contábeis e Fiscais do Setor Público Brasileiro (SICONFI).";

// Selo da capa quando o Contentful não responde ("Painel de Economia e Renda").
export const PIB_MACROTHEME = "Economia e Renda";

// Paleta dos gráficos do PIB, do protótipo. Literais: o SVG baixado como
// imagem não enxerga as variáveis CSS do painel.
export const PIB_COLORS = {
  total: "#f2761c",
  totalInk: "#b4500a",
  perCapita: "#1e88c7",
  perCapitaInk: "#0f6091",
  vabBar: "#973815",
  atividadeBar: "#f2761c",
  offArea: "#e9e5df",
  sea: "#d6f1fa",
  inkStrong: "#1b1a1c",
  muted: "#595557",
  line: "#dcdbdc",
} as const;
