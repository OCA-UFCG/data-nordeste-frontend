import type { ExpressionSpecification, FilterSpecification } from "maplibre-gl";
import type { Feature, FeatureCollection, Position } from "geojson";

import type { FeatureLevel } from "@/features/panelMap/featureLevel";
import type { MapRecorte } from "@/features/panelMap/mapRecorte";
import type { TerritorialArea } from "@/features/panels/territorialFilters";

export const VEIL_COLOR = "#9ca3af";
export const VEIL_OPACITY = 0.75;

// Destaque da legenda: as feições fora da classe passam a cinza sólido, e as
// da classe mantêm a cor (ou o raster). INTENTIONAL: decisão do usuário em
// 24/11/2026 — cinza #e5e5e5 opaco, não um véu translúcido.
export const CLASS_MUTED_COLOR = "#e5e5e5";

export type Bounds = [[number, number], [number, number]];

export type FitSources = {
  features: FeatureCollection;
  states: FeatureCollection;
  areas: FeatureCollection;

  // `estados_<area>.geojson`: só a parte de cada estado dentro da área. Com
  // ele, o estado escolhido é enquadrado pela parte que o mapa pinta.
  areaStates?: FeatureCollection;
};

/**
 * Cada estado partido pela área de interesse: `inside` é o
 * `estados_<area>.geojson` (hover e seleção), `outside` o
 * `estados_fora_<area>.geojson` (véu da parte de fora do estado escolhido).
 */
export type AreaStates = {
  inside: FeatureCollection;
  outside: FeatureCollection;
};

type VeilFilters = {
  states: FilterSpecification | null;

  // Os estados escolhidos, na fonte da parte deles fora da área: esse pedaço
  // fica cinza como o resto fora do recorte.
  selectedStates: FilterSpecification | null;
  features: FilterSpecification | null;
};

/** Feições com `property` em `values`. Ex.: `propertyIn("code", ["PE"])`. */
export function propertyIn(
  property: string,
  values: string[],
): ExpressionSpecification {
  return ["in", ["get", property], ["literal", values]];
}

/** Feições da área de interesse. Ex.: `areaFilter("semiarido")` → `["==", ["get", "semiarido"], 1]`. */
export function areaFilter(area: TerritorialArea): FilterSpecification {
  return ["==", ["get", area], 1];
}

const NO_VEIL: VeilFilters = {
  states: null,
  selectedStates: null,
  features: null,
};

/**
 * Filtros do véu cinza. WHY: o véu só existe a partir do nível estado — no
 * nível área toda a região está em foco, então nada é cobrido.
 * Ex.: `veilFilters({ uf: ["PE"], mun: [] }).states` → estados com `code` fora de PE.
 */
export function veilFilters(recorte: MapRecorte): VeilFilters {
  if (recorte.uf.length === 0) return NO_VEIL;

  const selectedStates = propertyIn("code", recorte.uf);
  const states: FilterSpecification = ["!", selectedStates];

  if (recorte.mun.length === 0)
    return { states, selectedStates, features: null };

  return {
    states,
    selectedStates,
    features: [
      "all",
      propertyIn("uf", recorte.uf),
      ["!", propertyIn("code", recorte.mun)],
    ],
  };
}

/**
 * Limites dos municípios do(s) estado(s) escolhido(s), na área de interesse.
 * WHY: a malha municipal só aparece sozinha a partir de MUNICIPAL_LINES_ZOOM,
 * acima do zoom em que o estado é enquadrado; com o estado selecionado, a
 * divisa dos municípios dele aparece já (pedido do usuário, 25/11/2026). Null
 * sem estado ou com feições de estado (IDH).
 * Ex.: `stateMunicipalLinesFilter({ uf: ["PE"], mun: [] }, "nordeste", "municipio")`.
 */
export function stateMunicipalLinesFilter(
  recorte: MapRecorte,
  area: TerritorialArea,
  level: FeatureLevel,
): FilterSpecification | null {
  if (level !== "municipio" || recorte.uf.length === 0) return null;

  // WHY o cast: o areaFilter é uma expressão (`["==", ["get", …], 1]`), mas
  // é tipado como FilterSpecification, que o "all" de expressões não aceita.
  const inArea = areaFilter(area) as ExpressionSpecification;

  return ["all", inArea, propertyIn("uf", recorte.uf)];
}

/**
 * Contorno grosso da seleção: municípios em `mun`, senão estados em `uf`. Com
 * feições de estado (IDH), `mun` não se aplica.
 */
export function selectionFilter(
  recorte: MapRecorte,
  level: FeatureLevel,
): FilterSpecification | null {
  const codes =
    level === "municipio" && recorte.mun.length > 0 ? recorte.mun : recorte.uf;

  return codes.length > 0 ? propertyIn("code", codes) : null;
}

function polygonPositions(feature: Feature): Position[] {
  const geometry = feature.geometry;

  if (geometry?.type === "Polygon") return geometry.coordinates.flat();
  if (geometry?.type === "MultiPolygon") return geometry.coordinates.flat(2);

  throw new Error(
    `Unsupported geometry "${geometry?.type}" in feature "${feature.properties?.code}"; expected Polygon or MultiPolygon.`,
  );
}

/** Caixa `[[oeste, sul], [leste, norte]]` das feições, ou `null` sem nenhuma. */
export function bboxOf(features: Feature[]): Bounds | null {
  const positions = features.flatMap(polygonPositions);

  if (positions.length === 0) return null;
  const lngs = positions.map(([lng]) => lng);
  const lats = positions.map(([, lat]) => lat);

  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

function featuresWhere(
  collection: FeatureCollection,
  property: string,
  accepted: string[],
): Feature[] {
  return collection.features.filter((feature) =>
    accepted.includes(feature.properties?.[property]),
  );
}

// A parte dos estados dentro da área, senão (sem arquivo, ou nenhum dos
// estados nela) os estados inteiros.
function statesBbox(uf: string[], sources: FitSources): Bounds | null {
  const inArea = sources.areaStates
    ? bboxOf(featuresWhere(sources.areaStates, "code", uf))
    : null;

  return inArea ?? bboxOf(featuresWhere(sources.states, "code", uf));
}

/**
 * Enquadramento do recorte: municípios, senão estados (a parte dentro da
 * área, com `areaStates`), senão a área.
 * Ex.: `{ uf: ["PE","PB"], mun: [] }` → caixa que cobre os dois estados.
 */
export function fitTargetFor(
  recorte: MapRecorte,
  area: TerritorialArea,
  sources: FitSources,
): Bounds | null {
  if (recorte.mun.length > 0) {
    return bboxOf(featuresWhere(sources.features, "code", recorte.mun));
  }
  if (recorte.uf.length > 0) return statesBbox(recorte.uf, sources);

  return bboxOf(featuresWhere(sources.areas, "area", [area]));
}
