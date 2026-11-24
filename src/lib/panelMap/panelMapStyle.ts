import type {
  ExpressionSpecification,
  GeoJSONSourceSpecification,
  LayerSpecification,
  LineLayerSpecification,
  RasterSourceSpecification,
  StyleSpecification,
} from "maplibre-gl";
import type { FeatureCollection } from "geojson";

import {
  BASEMAP_KINDS,
  BASEMAPS,
  basemapLayerId,
  type BasemapKind,
} from "@/lib/panelMap/basemaps";
import { VEIL_COLOR, VEIL_OPACITY } from "@/features/panelMap/mapLayers";

export const PANEL_MAP_SOURCE = {
  features: "features",
  states: "states",
  areas: "areas",
  aridez: "aridez",
} as const;

// A ordem do array em panelMapStyle é a ordem de desenho (de baixo para cima).
// A aridez entra sob demanda logo abaixo de indicatorFill (ver panelMapAridez).
export const PANEL_MAP_LAYER = {
  aridez: "aridez",
  indicatorFill: "indicator-fill",
  veilStates: "veil-states",
  veilFeatures: "veil-features",
  featureOutline: "feature-outline",
  featureHover: "feature-hover",
  stateOutline: "state-outline",
  areaOutline: "area-outline",
  selectionFeatures: "selection-features",
  selectionStates: "selection-states",
} as const;

// Semitransparente: o basemap (relevo, litoral) continua legível sob as classes.
const INDICATOR_FILL_OPACITY = 0.85;

// Contornos do qgz chegam pelo setIndicatorPaint; até lá, nada aparece.
const UNPAINTED_LINE: LineStyle = { color: "rgba(0, 0, 0, 0)", width: 0 };
const HOVER_OUTLINE: LineStyle = { color: "#111827", width: 2 };
const AREA_OUTLINE: LineStyle = { color: "#374151", width: 1 };
const SELECTION_OUTLINE: LineStyle = { color: "#1f2937", width: 2.5 };

const EMPTY_COLLECTION: FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

// promoteId: o `code` vira o id da feição — o hover usa feature-state por id.
function featureSource(): GeoJSONSourceSpecification {
  return { type: "geojson", data: EMPTY_COLLECTION, promoteId: "code" };
}

function basemapSource(kind: BasemapKind): RasterSourceSpecification {
  const basemap = BASEMAPS[kind];

  return {
    type: "raster",
    tiles: [basemap.tiles],
    tileSize: 256,
    attribution: basemap.attribution,
    ...(basemap.maxzoom === undefined ? {} : { maxzoom: basemap.maxzoom }),
  };
}

function basemapLayer(kind: BasemapKind, active: BasemapKind) {
  return {
    id: basemapLayerId(kind),
    type: "raster",
    source: basemapLayerId(kind),
    layout: { visibility: kind === active ? "visible" : "none" },
  } satisfies LayerSpecification;
}

type LineStyle = { color: string; width: number };

function lineLayer(
  id: string,
  source: string,
  line: LineStyle,
  visibility: "visible" | "none" = "visible",
): LineLayerSpecification {
  return {
    id,
    type: "line",
    source,
    layout: { visibility },
    paint: { "line-color": line.color, "line-width": line.width },
  };
}

function indicatorFillLayer(): LayerSpecification {
  return {
    id: PANEL_MAP_LAYER.indicatorFill,
    type: "fill",
    source: PANEL_MAP_SOURCE.features,

    // Transparente até o setIndicatorPaint (o padrão do MapLibre é preto).
    paint: {
      "fill-color": "rgba(0, 0, 0, 0)",
      "fill-opacity": INDICATOR_FILL_OPACITY,
    },
  };
}

function veilLayer(id: string, source: string): LayerSpecification {
  return {
    id,
    type: "fill",
    source,
    layout: { visibility: "none" },
    paint: { "fill-color": VEIL_COLOR, "fill-opacity": VEIL_OPACITY },
  };
}

function hoverLayer(): LayerSpecification {
  const hovered: ExpressionSpecification = [
    "boolean",
    ["feature-state", "hover"],
    false,
  ];
  const { featureHover } = PANEL_MAP_LAYER;
  const layer = lineLayer(
    featureHover,
    PANEL_MAP_SOURCE.features,
    HOVER_OUTLINE,
  );

  return {
    ...layer,
    paint: { ...layer.paint, "line-opacity": ["case", hovered, 1, 0] },
  };
}

// Sem área escolhida, o filtro não casa nada; o setIndicatorPaint troca.
function areaOutlineLayer(): LayerSpecification {
  const { areaOutline } = PANEL_MAP_LAYER;

  return {
    ...lineLayer(areaOutline, PANEL_MAP_SOURCE.areas, AREA_OUTLINE),
    filter: ["==", ["get", "area"], ""],
  };
}

// Camadas acima dos basemaps, de baixo para cima.
function overlayLayers(): LayerSpecification[] {
  const { features, states } = PANEL_MAP_SOURCE;
  const layer = PANEL_MAP_LAYER;

  return [
    indicatorFillLayer(),
    veilLayer(layer.veilStates, states),
    veilLayer(layer.veilFeatures, features),
    lineLayer(layer.featureOutline, features, UNPAINTED_LINE),
    hoverLayer(),
    lineLayer(layer.stateOutline, states, UNPAINTED_LINE),
    areaOutlineLayer(),
    lineLayer(layer.selectionFeatures, features, SELECTION_OUTLINE, "none"),
    lineLayer(layer.selectionStates, states, SELECTION_OUTLINE, "none"),
  ];
}

function panelMapSources(): StyleSpecification["sources"] {
  const basemaps = BASEMAP_KINDS.map((kind) => [
    basemapLayerId(kind),
    basemapSource(kind),
  ]);

  return {
    ...Object.fromEntries(basemaps),
    [PANEL_MAP_SOURCE.features]: featureSource(),
    [PANEL_MAP_SOURCE.states]: featureSource(),
    [PANEL_MAP_SOURCE.areas]: featureSource(),
  };
}

/**
 * Estilo inicial do mapa dos painéis: os dois basemaps (só `basemap` visível),
 * as fontes GeoJSON vazias e todas as camadas na ordem de desenho. As cores do
 * indicador e os filtros chegam depois, pelo motor.
 *
 * @example new maplibre.Map({ container, style: panelMapStyle("oceano") })
 */
export function panelMapStyle(basemap: BasemapKind): StyleSpecification {
  return {
    version: 8,
    sources: panelMapSources(),
    layers: [
      ...BASEMAP_KINDS.map((kind) => basemapLayer(kind, basemap)),
      ...overlayLayers(),
    ],
  };
}
