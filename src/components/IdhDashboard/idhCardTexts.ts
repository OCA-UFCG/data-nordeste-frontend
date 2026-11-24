import {
  listYears,
  type YearRange,
} from "@/features/panels/territorialFilters";

// Textos dos cards do painel de IDH: o ⓘ de cada card.
// Textos que dizem respeito ao IDH ficam aqui, não nos componentes do painel.

// Textos do ⓘ de cada card, do protótipo. Diferem dele num ponto: no banco há
// série anual por estado, então a linha não é sempre a média do Nordeste.
export const IDH_CARD_INFO = {
  map: "Cada estado recebe a cor da sua faixa de desenvolvimento humano. Aproxime o mapa ou clique em um estado para usá-lo como filtro do painel; clicar fora do estado escolhido volta à visão do Nordeste.",
  ranking:
    "Estados ordenados do maior para o menor IDH, na cor da faixa. As barras vão de 0 a 1. Clique em uma barra para filtrar o painel.",
  groups:
    "Compara os dois grupos no local e no ano escolhidos. O tamanho da barra segue a escala indicada abaixo dela.",
} as const;

// Rótulo do mapa para leitores de tela (o título do card é `MAP_TITLE`).
export const IDH_MAP_LABEL = "Mapa do IDH por estado do Nordeste";

/**
 * ⓘ do card de evolução; o período vem do intervalo de anos do banco.
 *
 * @example idhEvolutionInfo({ first: 2012, last: 2021 }) // "Média dos estados do Nordeste ou, ..., de 2012 a 2021. ..."
 */
export const idhEvolutionInfo = (range: YearRange): string => {
  const period = listYears(range).length
    ? `, de ${range.first} a ${range.last}`
    : "";

  return `Média dos estados do Nordeste ou, com um estado no filtro, a série desse estado${period}. O IDH ajustado à desigualdade desconta as diferenças entre grupos da população. Clique em um ponto para escolher o ano.`;
};
