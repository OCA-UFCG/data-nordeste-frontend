import type { FeatureCollection } from "geojson";

import type {
  MapFeatureProps,
  PanelIndicator,
} from "@/features/panelMap/geodataTypes";
import type { MapLevel, MapRecorte } from "@/features/panelMap/mapRecorte";
import type { TerritorialArea } from "@/features/panels/territorialFilters";

/**
 * Recorte escolhido pelo clique numa feição do indicador. No IDH a feição é o
 * estado; nos painéis municipais é o município, ou o estado dele quando o
 * painel não desce até município.
 * Ex.: clique em Recife com `deepest: "municipio"` → `{ uf: ["PE"], mun: ["2611606"] }`.
 */
export function recorteForClick(
  feature: MapFeatureProps,
  indicator: PanelIndicator,
  deepest: MapLevel,
): MapRecorte {
  if (indicator === "idh") return { uf: [feature.code], mun: [] };
  if (deepest !== "municipio") return { uf: [feature.uf], mun: [] };

  return { uf: [feature.uf], mun: [feature.code] };
}

/**
 * Feições que entram no ranking do tooltip: os municípios marcados na área de
 * interesse; no IDH, os 9 estados (o IDH só existe para o Nordeste).
 * Ex.: `featuresInArea(municipios, "pib", "semiarido")` → só os do semiárido.
 */
export function featuresInArea(
  features: MapFeatureProps[],
  indicator: PanelIndicator,
  area: TerritorialArea,
): MapFeatureProps[] {
  if (indicator === "idh") return features;

  return features.filter((feature) => feature[area] === 1);
}

/**
 * Propriedades de cada feição da coleção, na ordem do arquivo.
 * Ex.: `featureProps(geodata.features)` → `[{ code: "2611606", … }, …]`.
 */
export function featureProps(collection: FeatureCollection): MapFeatureProps[] {
  return collection.features.map(
    (feature) => feature.properties as MapFeatureProps,
  );
}
