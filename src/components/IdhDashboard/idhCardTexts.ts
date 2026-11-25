// Textos dos cards do painel de IDH: o ⓘ de cada card.
// Textos que dizem respeito ao IDH ficam aqui, não nos componentes do painel.

// Textos do ⓘ de cada card, do protótipo. Diferem dele num ponto: no banco há
// série anual por estado, então a linha não é sempre a média do Nordeste.
export const IDH_CARD_INFO = {
  map: "Cada estado recebe a cor da sua faixa de desenvolvimento humano. Aproxime o mapa ou clique em um estado para usá-lo como filtro do painel. O painel sempre mostra um estado: afastar o mapa não tira o estado escolhido do filtro.",
  ranking:
    "Estados ordenados do maior para o menor IDH, na cor da faixa. As barras vão de 0 a 1. Clique em uma barra para filtrar o painel.",
  groups:
    "Compara os dois grupos no local e no ano escolhidos. O tamanho da barra segue a escala indicada abaixo dela.",
} as const;

// Rótulo do mapa para leitores de tela (o título do card é `MAP_TITLE`).
export const IDH_MAP_LABEL = "Mapa do IDH por estado do Nordeste";
