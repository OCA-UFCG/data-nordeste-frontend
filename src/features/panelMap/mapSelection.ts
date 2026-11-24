import type { FeatureCollection } from "geojson";

import type {
  MapFeatureProps,
  PanelIndicator,
} from "@/features/panelMap/geodataTypes";
import type { FeatureLevel } from "@/features/panelMap/featureLevel";
import {
  EMPTY_RECORTE,
  sameRecorte,
  type MapLevel,
  type MapRecorte,
} from "@/features/panelMap/mapRecorte";
import type { TerritorialArea } from "@/features/panels/territorialFilters";

// Recorte que o clique escolhe: o município (ou o estado dele, quando o painel
// não desce até município); com feições de estado, o próprio estado.
function pickedRecorte(
  feature: MapFeatureProps,
  level: FeatureLevel,
  deepest: MapLevel,
): MapRecorte {
  if (level === "estado") return { uf: [feature.code], mun: [] };
  if (deepest !== "municipio") return { uf: [feature.uf], mun: [] };

  return { uf: [feature.uf], mun: [feature.code] };
}

// Um nível acima do recorte: município → estado, estado → área de interesse.
function oneLevelUp(current: MapRecorte): MapRecorte {
  if (current.mun.length > 0) return { uf: current.uf, mun: [] };

  return EMPTY_RECORTE;
}

// Estado ao qual a feição pertence (com feições de estado, ela mesma).
function ufOfFeature(feature: MapFeatureProps, level: FeatureLevel): string {
  return level === "estado" ? feature.code : feature.uf;
}

/**
 * Recorte escolhido pelo clique no mapa. `clicked` é a feição sob o cursor, ou
 * `null` quando o clique caiu fora das feições do indicador (mar, fora da
 * área). Com feições de estado (IDH, vista Estados) a feição é o estado; com
 * as municipais é o município, ou o estado dele quando o painel não desce até
 * município. Regras, pelo recorte atual:
 * - área: a feição vira o recorte; clique no vazio não muda nada.
 * - estado: uma feição dentro do(s) estado(s) escolhido(s) vira o recorte
 *   (município, ou só aquele estado se eram vários); clicar no próprio estado
 *   (já era o recorte), em outro estado ou no vazio volta à área.
 * - município: qualquer clique volta ao estado, inclusive no próprio município.
 * Ex.: clique em Recife (`deepest: "municipio"`) com `EMPTY_RECORTE` →
 * `{ uf: ["PE"], mun: ["2611606"] }`; qualquer clique depois → `{ uf: ["PE"], mun: [] }`;
 * outro clique fora de PE → `EMPTY_RECORTE`.
 */
export function recorteForClick(
  clicked: MapFeatureProps | null,
  level: FeatureLevel,
  deepest: MapLevel,
  current: MapRecorte,
): MapRecorte {
  if (current.mun.length > 0) return oneLevelUp(current);
  if (current.uf.length === 0) {
    return clicked ? pickedRecorte(clicked, level, deepest) : current;
  }
  if (!clicked || !current.uf.includes(ufOfFeature(clicked, level))) {
    return oneLevelUp(current);
  }

  const picked = pickedRecorte(clicked, level, deepest);

  return sameRecorte(picked, current) ? oneLevelUp(current) : picked;
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
