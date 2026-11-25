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

// Com município escolhido: clicar num dos escolhidos volta ao estado dele, em
// outro município o escolhe, e no vazio nada muda (não sobe de nível).
function recorteFromMunicipio(
  clicked: MapFeatureProps | null,
  level: FeatureLevel,
  deepest: MapLevel,
  current: MapRecorte,
): MapRecorte {
  if (!clicked) return current;
  if (current.mun.includes(clicked.code)) return { uf: [clicked.uf], mun: [] };

  return pickedRecorte(clicked, level, deepest);
}

// Estado ao qual a feição pertence (com feições de estado, ela mesma).
function ufOfFeature(feature: MapFeatureProps, level: FeatureLevel): string {
  return level === "estado" ? feature.code : feature.uf;
}

/**
 * Recorte escolhido pelo clique no mapa. `clicked` é a feição sob o cursor, ou
 * `null` quando o clique caiu fora das feições do indicador (mar, fora da
 * área). Com feições de estado (IDH) a feição é o estado; com as municipais é
 * o município. O clique desce um nível por vez (área → estado → município).
 * Regras, pelo recorte atual:
 * - área: o estado da feição vira o recorte (nunca o município direto);
 *   clique no vazio não muda nada.
 * - estado: uma feição dentro do(s) estado(s) escolhido(s) vira o recorte
 *   (município, ou só aquele estado se eram vários); clicar no próprio estado
 *   (já era o recorte), em outro estado ou no vazio volta à área.
 * - município: clicar no município escolhido (ou em um dos escolhidos) volta ao
 *   estado dele; clicar em outro município o escolhe; clicar no vazio não
 *   muda nada (clicar fora não sobe de nível).
 * Ex.: clique em Recife (`deepest: "municipio"`) com `EMPTY_RECORTE` →
 * `{ uf: ["PE"], mun: [] }`; novo clique em Recife → `{ uf: ["PE"], mun: ["2611606"] }`;
 * de novo em Recife → `{ uf: ["PE"], mun: [] }`; no vazio, nada muda.
 */
export function recorteForClick(
  clicked: MapFeatureProps | null,
  level: FeatureLevel,
  deepest: MapLevel,
  current: MapRecorte,
): MapRecorte {
  if (current.mun.length > 0) {
    return recorteFromMunicipio(clicked, level, deepest, current);
  }
  if (current.uf.length === 0) {
    return clicked ? { uf: [ufOfFeature(clicked, level)], mun: [] } : current;
  }
  if (!clicked || !current.uf.includes(ufOfFeature(clicked, level))) {
    return EMPTY_RECORTE;
  }

  const picked = pickedRecorte(clicked, level, deepest);

  return sameRecorte(picked, current) ? EMPTY_RECORTE : picked;
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
