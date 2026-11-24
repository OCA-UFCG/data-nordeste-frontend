// Dica da tela cheia dos painéis com o mapa MapLibre: o zoom e o clique mudam
// o filtro do painel.
export const PANEL_MAP_HINT = "Aproxime o mapa ou clique para filtrar o painel";

/**
 * Fonte da imagem baixada do mapa: o fundo é do Esri, e a atribuição vai
 * junto da fonte do dado do painel.
 *
 * @example panelMapImageSource("Fonte: IBGE · Data Nordeste") // "Fonte: IBGE · Data Nordeste · Basemap: Esri"
 */
export const panelMapImageSource = (cardSource: string): string =>
  `${cardSource} · Basemap: Esri`;
