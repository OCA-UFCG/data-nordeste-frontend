import type {
  ExpressionSpecification,
  FilterSpecification,
  GeoJSONSource,
  Map as MaplibreMap,
} from "maplibre-gl";

import type { QgisOutline } from "@/features/panelMap/geodataTypes";
import {
  areaFilter,
  type FitSources,
  type veilFilters,
} from "@/features/panelMap/mapLayers";
import type { TerritorialArea } from "@/features/panels/territorialFilters";
import {
  BASEMAP_KINDS,
  basemapLayerId,
  type BasemapKind,
} from "@/lib/panelMap/basemaps";
import {
  PANEL_MAP_LAYER,
  PANEL_MAP_SOURCE,
} from "@/lib/panelMap/panelMapStyle";

export type IndicatorPaint = {
  color: ExpressionSpecification;
  outline: QgisOutline;
  stateOutline: QgisOutline;
  area: TerritorialArea;
};

export type VeilFilters = ReturnType<typeof veilFilters>;

/** Mostra só a camada do basemap escolhido. */
export function showBasemap(map: MaplibreMap, active: BasemapKind): void {
  BASEMAP_KINDS.forEach((kind) =>
    map.setLayoutProperty(
      basemapLayerId(kind),
      "visibility",
      kind === active ? "visible" : "none",
    ),
  );
}

function geojsonSource(map: MaplibreMap, id: string): GeoJSONSource {
  const source = map.getSource<GeoJSONSource>(id);

  if (!source) {
    throw new Error(
      `Panel map source "${id}" is missing; expected one of the GeoJSON sources declared in panelMapStyle.`,
    );
  }

  return source;
}

/** Troca os dados das três fontes GeoJSON (feições, estados e áreas). */
export function setSourceData(map: MaplibreMap, sources: FitSources): void {
  geojsonSource(map, PANEL_MAP_SOURCE.features).setData(sources.features);
  geojsonSource(map, PANEL_MAP_SOURCE.states).setData(sources.states);
  geojsonSource(map, PANEL_MAP_SOURCE.areas).setData(sources.areas);
}

function paintLine(map: MaplibreMap, layerId: string, outline: QgisOutline) {
  map.setPaintProperty(layerId, "line-color", outline.color);
  map.setPaintProperty(layerId, "line-width", outline.widthPx);
}

/**
 * Cores do indicador, contornos do qgz e a área de interesse: só as feições da
 * área são pintadas, e o limite da área ganha um traço fino.
 */
export function paintIndicator(map: MaplibreMap, paint: IndicatorPaint): void {
  const inArea = areaFilter(paint.area);
  const { indicatorFill, featureOutline, featureHover } = PANEL_MAP_LAYER;

  map.setPaintProperty(indicatorFill, "fill-color", paint.color);
  [indicatorFill, featureOutline, featureHover].forEach((layerId) =>
    map.setFilter(layerId, inArea),
  );
  paintLine(map, featureOutline, paint.outline);
  paintLine(map, PANEL_MAP_LAYER.stateOutline, paint.stateOutline);
  map.setFilter(PANEL_MAP_LAYER.areaOutline, [
    "==",
    ["get", "area"],
    paint.area,
  ]);
}

// Filtro nulo = camada escondida (o véu e a seleção somem sem recorte).
function filterOrHide(
  map: MaplibreMap,
  layerId: string,
  filter: FilterSpecification | null,
): void {
  map.setLayoutProperty(layerId, "visibility", filter ? "visible" : "none");
  if (filter) map.setFilter(layerId, filter);
}

/** Véu cinza sobre o que está fora do recorte (estados e feições). */
export function applyVeil(map: MaplibreMap, veil: VeilFilters): void {
  filterOrHide(map, PANEL_MAP_LAYER.veilStates, veil.states);
  filterOrHide(map, PANEL_MAP_LAYER.veilFeatures, veil.features);
}

/**
 * Contorno grosso da seleção. O filtro casa por `code`, que pode ser de
 * município ou de UF; aplicado às duas fontes, cada uma só casa os seus.
 */
export function applySelection(
  map: MaplibreMap,
  filter: FilterSpecification | null,
): void {
  filterOrHide(map, PANEL_MAP_LAYER.selectionFeatures, filter);
  filterOrHide(map, PANEL_MAP_LAYER.selectionStates, filter);
}
