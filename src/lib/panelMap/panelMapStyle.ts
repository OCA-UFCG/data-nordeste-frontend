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
import {
  CLASS_MUTED_COLOR,
  VEIL_COLOR,
  VEIL_OPACITY,
} from "@/features/panelMap/mapLayers";
import { MUNICIPAL_LINES_ZOOM } from "@/features/panelMap/mapRecorte";

// `states` é o `estados.geojson` inteiro (contorno estadual, véu); `areaStates`
// é o `estados_<area>.geojson`, só a parte de cada estado dentro da área de
// interesse (hover e contorno da seleção de estado).
export const PANEL_MAP_SOURCE = {
  features: "features",
  states: "states",
  areaStates: "area-states",
  areas: "areas",
  aridez: "aridez",
} as const;

// A ordem do array em panelMapStyle é a ordem de desenho (de baixo para cima).
// A aridez entra sob demanda logo abaixo de indicatorFill (ver panelMapAridez).
export const PANEL_MAP_LAYER = {
  veilSelectedStates: "veil-selected-states",
  aridez: "aridez",
  indicatorFill: "indicator-fill",
  classMuted: "class-muted",
  veilStates: "veil-states",
  veilFeatures: "veil-features",
  featureOutline: "feature-outline",
  featureHover: "feature-hover",
  stateOutline: "state-outline",
  stateHover: "state-hover",
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

// Destaque da legenda: escondido até o setClassHighlight, que decide por
// feição a opacidade (0 na classe destacada, 1 nas outras: cinza sólido,
// cobrindo também o raster da aridez). Fica sob o véu e a seleção.
function classMutedLayer(): LayerSpecification {
  return {
    id: PANEL_MAP_LAYER.classMuted,
    type: "fill",
    source: PANEL_MAP_SOURCE.features,
    layout: { visibility: "none" },
    paint: { "fill-color": CLASS_MUTED_COLOR, "fill-opacity": 0 },
  };
}

// Limites conforme o zoom, um nível antes dos limiares do recorte
// (mapRecorte): a área de interesse e os estados em qualquer zoom (decisão do
// usuário, 24/11/2026); os municípios a partir de MUNICIPAL_LINES_ZOOM. Assim a
// divisa municipal já aparece antes de o zoom filtrar por ela. O preenchimento
// das classes, o véu e a seleção aparecem em qualquer zoom. INTENTIONAL: com feições de
// estado (IDH), o contorno delas aparece em qualquer zoom; sem ele a antiga
// malha rosa da vista Estados do perfil virava uma mancha só (decisão do
// controlador, 24/11/2026; a vista saiu depois, a regra ficou para o IDH).
function withMinZoom<Layer extends LayerSpecification>(
  layer: Layer,
  minzoom: number,
): Layer {
  return { ...layer, minzoom };
}

function featureOutlineLayer(municipal: boolean): LayerSpecification {
  const { featureOutline } = PANEL_MAP_LAYER;
  const layer = lineLayer(
    featureOutline,
    PANEL_MAP_SOURCE.features,
    UNPAINTED_LINE,
  );

  return municipal ? withMinZoom(layer, MUNICIPAL_LINES_ZOOM) : layer;
}

function stateOutlineLayer(): LayerSpecification {
  const { states } = PANEL_MAP_SOURCE;

  return lineLayer(PANEL_MAP_LAYER.stateOutline, states, UNPAINTED_LINE);
}

// WHY o hover não tem minzoom: não é limite, é o sinal de qual feição o
// tooltip está nomeando, em qualquer zoom (decisão do controlador). Há um por
// fonte: o das feições e o dos estados recortados pela área (hover por estado
// só com a área de interesse, `hoverLevelFor`; só a parte do estado dentro da
// área acende); o dos estados fica acima do contorno estadual.
function hoverLayer(id: string, source: string): LayerSpecification {
  const hovered: ExpressionSpecification = [
    "boolean",
    ["feature-state", "hover"],
    false,
  ];
  const layer = lineLayer(id, source, HOVER_OUTLINE);

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

// Camadas acima dos basemaps, de baixo para cima. WHY o véu do estado
// escolhido fica sob o preenchimento (e sob o raster da aridez, que entra logo
// abaixo do preenchimento): cobre o estado inteiro, mas a parte dele na área é
// pintada por cima; só a de fora fica cinza, como o resto fora do recorte.
function overlayLayers(municipal: boolean): LayerSpecification[] {
  const { features, states, areaStates } = PANEL_MAP_SOURCE;
  const layer = PANEL_MAP_LAYER;

  return [
    veilLayer(layer.veilSelectedStates, states),
    indicatorFillLayer(),
    classMutedLayer(),
    veilLayer(layer.veilStates, states),
    veilLayer(layer.veilFeatures, features),
    featureOutlineLayer(municipal),
    hoverLayer(layer.featureHover, features),
    stateOutlineLayer(),
    hoverLayer(layer.stateHover, areaStates),
    areaOutlineLayer(),
    lineLayer(layer.selectionFeatures, features, SELECTION_OUTLINE, "none"),
    lineLayer(layer.selectionStates, areaStates, SELECTION_OUTLINE, "none"),
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
    [PANEL_MAP_SOURCE.areaStates]: featureSource(),
    [PANEL_MAP_SOURCE.areas]: featureSource(),
  };
}

/**
 * Estilo inicial do mapa dos painéis: os dois basemaps (só `basemap` visível),
 * as fontes GeoJSON vazias e todas as camadas na ordem de desenho. As cores do
 * indicador e os filtros chegam depois, pelo motor. `municipal`: as feições
 * são municípios (decide o zoom em que o contorno delas aparece).
 *
 * @example new maplibre.Map({ container, style: panelMapStyle("padrao", true) })
 */
export function panelMapStyle(
  basemap: BasemapKind,
  municipal: boolean,
): StyleSpecification {
  return {
    version: 8,
    sources: panelMapSources(),
    layers: [
      ...BASEMAP_KINDS.map((kind) => basemapLayer(kind, basemap)),
      ...overlayLayers(municipal),
    ],
  };
}
