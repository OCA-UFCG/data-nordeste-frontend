// Textos dos cards do painel de IDH: o ⓘ de cada card.
// Textos que dizem respeito ao IDH ficam aqui, não nos componentes do painel.

// Textos do ⓘ de cada card, do protótipo. Diferem dele num ponto: no banco há
// série anual por estado, então a linha não é sempre a média do Nordeste.
// O mapa e o ranking usam o texto da revisão do painel (25/11/2026).
export const IDH_CARD_INFO = {
  map: "Cada estado é representado pela cor correspondente à sua classificação do Índice de Desenvolvimento Humano (IDH). Clique em um estado para filtrar os dados do painel.",
  ranking:
    "Os estados são ordenados de forma decrescente pelo Índice de Desenvolvimento Humano (IDH) e representados por cores correspondentes às suas respectivas classes. Clique em uma barra do gráfico para filtrar os dados do painel.",
  groups:
    "Compara os dois grupos no local e no ano escolhidos. O tamanho da barra segue a escala indicada abaixo dela.",
} as const;

// Rótulo do mapa para leitores de tela (o título do card é `MAP_TITLE`).
export const IDH_MAP_LABEL = "Mapa do IDH por estado do Nordeste";
