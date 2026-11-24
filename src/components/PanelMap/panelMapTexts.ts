import { DEFAULT_BASEMAP } from "@/components/PanelMap/usePanelMapEngine";
import { BASEMAPS, type BasemapKind } from "@/lib/panelMapEngine";

// Dica da tela cheia dos painéis com o mapa MapLibre: o zoom e o clique mudam
// o filtro do painel.
export const PANEL_MAP_HINT =
  "Aproxime o mapa ou clique para filtrar o painel; clique de novo no município escolhido, ou fora do estado escolhido, para voltar um nível";

/**
 * Fonte da imagem baixada do mapa: a fonte do dado do painel e o crédito do
 * basemap que aparece nela (o Padrão credita o OpenStreetMap; o satélite, Esri,
 * Maxar e Earthstar). Sem
 * `basemap`, o crédito do padrão (rodapé da tela cheia).
 *
 * @example panelMapImageSource("Fonte: IBGE · Data Nordeste", "satelite") // "Fonte: IBGE · Data Nordeste · Basemap: Esri, Maxar, Earthstar Geographics"
 */
export const panelMapImageSource = (
  cardSource: string,
  basemap: BasemapKind = DEFAULT_BASEMAP,
): string => `${cardSource} · Basemap: ${BASEMAPS[basemap].attribution}`;
