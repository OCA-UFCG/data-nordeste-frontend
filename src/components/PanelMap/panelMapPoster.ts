import type { PanelMapProps } from "@/components/PanelMap/PanelMap";
import type { ReadyGeodata } from "@/components/PanelMap/useGeodata";
import type { MapPosterCardInput } from "@/features/panels/mapPosterBuild";

// O que é próprio de cada painel no cartaz: o indicador do título ("Mapa do
// {name} - …"), o texto do subtítulo e a fonte, sem o crédito do basemap.
export type PanelMapPosterTexts = {
  name: string;
  subtitle: string;
  source: string;
};

/**
 * O que o card informa ao cartaz de download: os textos do painel mais o que
 * o mapa está mostrando (indicador, área, ano e recorte das props do
 * `PanelMap`) e os geodados já carregados.
 *
 * @example <PanelMapCardActions poster={panelMapPosterInput(mapProps, card.geodata, PIB_POSTER_TEXTS)} … />
 */
export const panelMapPosterInput = (
  mapProps: PanelMapProps,
  geodata: ReadyGeodata | null,
  texts: PanelMapPosterTexts,
): MapPosterCardInput => ({
  ...texts,
  indicator: mapProps.indicator,
  area: mapProps.area,
  ano: mapProps.ano,
  recorte: mapProps.recorte,
  classCounts: mapProps.classCounts,
  geodata,
});
