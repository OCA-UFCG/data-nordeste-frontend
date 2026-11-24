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

/**
 * Recorte escolhido pelo clique numa feição do mapa. Com feições de estado
 * (IDH, vista Estados) a feição é o estado; com as municipais é o município,
 * ou o estado dele quando o painel não desce até município. Clicar na feição
 * que já é o recorte atual volta um nível: município → estado, estado → área
 * de interesse (`EMPTY_RECORTE`).
 * Seleção múltipla: o recorte atual só "é" a feição quando é exatamente ela;
 * clicar numa de várias selecionadas escolhe só essa, sem voltar nível.
 * Ex.: clique em Recife (`deepest: "municipio"`) → `{ uf: ["PE"], mun: ["2611606"] }`;
 * clique de novo, com esse recorte atual → `{ uf: ["PE"], mun: [] }`.
 */
export function recorteForClick(
  feature: MapFeatureProps,
  level: FeatureLevel,
  deepest: MapLevel,
  current: MapRecorte,
): MapRecorte {
  const picked = pickedRecorte(feature, level, deepest);

  if (!sameRecorte(picked, current)) return picked;
  if (picked.mun.length > 0) return { uf: picked.uf, mun: [] };

  return EMPTY_RECORTE;
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
