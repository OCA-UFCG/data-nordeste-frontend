// Fora do módulo "use client": a página server também usa no estado de erro.
export const ARIDEZ_TITLE = "Índice de Aridez";

// Texto do rodapé do painel, o do protótipo.
export const ARIDEZ_SOURCE =
  "Fonte dos dados: XAVIER et al. (2019). Elaborado pelo Observatório da Caatinga e Desertificação · Data Nordeste";

// Selo da capa quando o Contentful não responde ("Painel de Meio Ambiente").
export const ARIDEZ_MACROTHEME = "Meio Ambiente";

// Cores fixas do mapa e do gráfico. Literais: o SVG baixado como imagem não
// enxerga as variáveis CSS do painel.
export const ARIDEZ_COLORS = {
  offArea: "#e9e5df",
  sea: "#d6f1fa",

  // Contorno do subúmido seco: o verde-claro some no fundo branco.
  subumidoEdge: "#758f21",
  grid: "#dcdbdc",
  axis: "#9a9698",
  muted: "#595557",
  ink: "#292829",
} as const;
