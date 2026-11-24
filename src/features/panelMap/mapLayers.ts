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
};

type VeilFilters = {
  states: FilterSpecification | null;
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

/**
 * Filtros do véu cinza. WHY: o véu só existe a partir do nível estado — no
 * nível área toda a região está em foco, então nada é cobrido.
 * Ex.: `veilFilters({ uf: ["PE"], mun: [] }).states` → estados com `code` fora de PE.
 */
export function veilFilters(recorte: MapRecorte): VeilFilters {
  if (recorte.uf.length === 0) return { states: null, features: null };

  const states: FilterSpecification = ["!", propertyIn("code", recorte.uf)];

  if (recorte.mun.length === 0) return { states, features: null };

  return {
    states,
    features: [
      "all",
      propertyIn("uf", recorte.uf),
      ["!", propertyIn("code", recorte.mun)],
    ],
  };
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

/**
 * Enquadramento do recorte: municípios, senão estados, senão a área.
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
  if (recorte.uf.length > 0) {
    return bboxOf(featuresWhere(sources.states, "code", recorte.uf));
  }

  return bboxOf(featuresWhere(sources.areas, "area", [area]));
}
