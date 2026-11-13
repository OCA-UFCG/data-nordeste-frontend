// Textos dos cards do painel de IDH: o ⓘ de cada card e o rodapé com a fonte.
// Textos que dizem respeito ao IDH ficam aqui, não nos componentes do painel.

// Textos do ⓘ de cada card, do protótipo. Diferem dele num ponto: no banco há
// série anual por estado, então a linha não é sempre a média do Nordeste.
export const IDH_CARD_INFO = {
  evolution:
    "Média dos estados do Nordeste ou, com um estado no filtro, a série desse estado, de 2012 a 2021. O IDH ajustado à desigualdade desconta as diferenças entre grupos da população. Clique em um ponto para escolher o ano.",
  map: "Cada estado recebe a cor da sua faixa de desenvolvimento humano. Clique em um estado para usá-lo como filtro do painel.",
  ranking:
    "Estados ordenados do maior para o menor IDH, na cor da faixa. As barras vão de 0 a 1. Clique em uma barra para filtrar o painel.",
  groups:
    "Compara os dois grupos no local e no ano escolhidos. O tamanho da barra segue a escala indicada abaixo dela.",
} as const;

// Fonte que vai no rodapé dos cards e na imagem baixada.
export const IDH_CARD_SOURCE = "Fonte: PNAD/IBGE · Data Nordeste";

// WARNING: o protótipo traz "Atualizado em 11/2026" fixo. O banco não informa
// quando a PNAD foi carregada; troque por essa data quando houver uma fonte.
export const IDH_DATA_UPDATED_AT = "11/2026";

export const IDH_CARD_FOOTER = {
  source: IDH_CARD_SOURCE,
  updatedAt: IDH_DATA_UPDATED_AT,
} as const;
