import type {
  ExpressionSpecification,
  GeoJSONSourceSpecification,
  LayerSpecification,
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
  statesQuery: "states-query",
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
const HOVER_OUTLINE = { color: "#111827", width: 2 };
const AREA_OUTLINE = { color: "#374151", width: 1 };
const SELECTION_OUTLINE = { color: "#1f2937", width: 2.5 };

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

function hiddenLine(id: string, source: string, color: string, width: number) {
  return {
    id,
    type: "line",
    source,
    layout: { visibility: "none" },
    paint: { "line-color": color, "line-width": width },
  } satisfies LayerSpecification;
}

function hiddenVeil(id: string, source: string) {
  return {
    id,
    type: "fill",
    source,
    layout: { visibility: "none" },
    paint: { "fill-color": VEIL_COLOR, "fill-opacity": VEIL_OPACITY },
  } satisfies LayerSpecification;
}

function fillLayers(): LayerSpecification[] {
  const { features, states } = PANEL_MAP_SOURCE;

  return [
    {
      id: PANEL_MAP_LAYER.indicatorFill,
      type: "fill",
      source: features,

      // Transparente até o setIndicatorPaint (o padrão do MapLibre é preto).
      paint: {
        "fill-color": "rgba(0, 0, 0, 0)",
        "fill-opacity": INDICATOR_FILL_OPACITY,
      },
    },

    // INTENTIONAL: invisível mas visível ao queryRenderedFeatures (visibility
    // "none" sairia da consulta) — é por ela que se acha a UF do centro.
    {
      id: PANEL_MAP_LAYER.statesQuery,
      type: "fill",
      source: states,
      paint: { "fill-opacity": 0 },
    },
    hiddenVeil(PANEL_MAP_LAYER.veilStates, states),
    hiddenVeil(PANEL_MAP_LAYER.veilFeatures, features),
  ];
}

function hoverLayer(): LayerSpecification {
  const hovered: ExpressionSpecification = [
    "boolean",
    ["feature-state", "hover"],
    false,
  ];

  return {
    id: PANEL_MAP_LAYER.featureHover,
    type: "line",
    source: PANEL_MAP_SOURCE.features,
    paint: {
      "line-color": HOVER_OUTLINE.color,
      "line-width": HOVER_OUTLINE.width,
      "line-opacity": ["case", hovered, 1, 0],
    },
  };
}

function outlineLayers(): LayerSpecification[] {
  const { features, states, areas } = PANEL_MAP_SOURCE;
  const selection = SELECTION_OUTLINE;

  return [
    { id: PANEL_MAP_LAYER.featureOutline, type: "line", source: features },
    hoverLayer(),
    { id: PANEL_MAP_LAYER.stateOutline, type: "line", source: states },
    {
      id: PANEL_MAP_LAYER.areaOutline,
      type: "line",
      source: areas,
      filter: ["==", ["get", "area"], ""],
      paint: {
        "line-color": AREA_OUTLINE.color,
        "line-width": AREA_OUTLINE.width,
      },
    },
    hiddenLine(
      PANEL_MAP_LAYER.selectionFeatures,
      features,
      selection.color,
      selection.width,
    ),
    hiddenLine(
      PANEL_MAP_LAYER.selectionStates,
      states,
      selection.color,
      selection.width,
    ),
  ];
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
    sources: {
      ...Object.fromEntries(
        BASEMAP_KINDS.map((kind) => [
          basemapLayerId(kind),
          basemapSource(kind),
        ]),
      ),
      [PANEL_MAP_SOURCE.features]: featureSource(),
      [PANEL_MAP_SOURCE.states]: featureSource(),
      [PANEL_MAP_SOURCE.areas]: featureSource(),
    },
    layers: [
      ...BASEMAP_KINDS.map((kind) => basemapLayer(kind, basemap)),
      ...fillLayers(),
      ...outlineLayers(),
    ],
  };
}
