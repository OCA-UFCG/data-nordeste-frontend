import type {
  FeatureIdentifier,
  MapLayerMouseEvent,
  Map as MaplibreMap,
  PointLike,
} from "maplibre-gl";

import type { MapFeatureProps } from "@/features/panelMap/geodataTypes";
import type { Bounds } from "@/features/panelMap/mapLayers";
import {
  PANEL_MAP_LAYER,
  PANEL_MAP_SOURCE,
} from "@/lib/panelMap/panelMapStyle";

export type PanelMapMoveEnd = {
  zoom: number;
  centerUf?: string;
  centerMun?: string;
  programmatic: boolean;

  // Só o fim de um fitTo. Um resize também é programático, mas não enquadrou.
  fit: boolean;
  fittedZoom: number;
};

export type PanelMapHover = { props: MapFeatureProps; x: number; y: number };

type FeatureId = FeatureIdentifier["id"];

// Marca os moveend do fitTo, só para registrar o fittedZoom. WHY eventData e
// não um flag: o flag fica preso quando o MapLibre não consegue enquadrar (sem
// moveend) e erra quando um fitTo interrompe outro.
const FIT_EVENT_DATA = { panelMapFit: true };

// IMPORTANT: só gesto do usuário vira filtro. Arrastar, roda do mouse, toque,
// teclado, duplo clique e os botões +/− mandam `originalEvent` no moveend; o
// fitTo e o resize do container (ResizeObserver → map.resize) não. Sem isto,
// redimensionar a janela viraria um recorte que ninguém escolheu.
function isUserMove(event: object): boolean {
  return "originalEvent" in event;
}

function codeAt(
  map: MaplibreMap,
  point: PointLike,
  layerId: string,
): string | undefined {
  const [feature] = map.queryRenderedFeatures(point, { layers: [layerId] });
  const code = feature?.properties?.code;

  return code === undefined ? undefined : String(code);
}

/** UF (e, com feições municipais, o município) sob o centro do mapa. */
function centerCodes(map: MaplibreMap, municipal: boolean) {
  const center = map.project(map.getCenter());
  const centerUf = codeAt(map, center, PANEL_MAP_LAYER.statesQuery);

  if (!municipal) return { centerUf };

  return {
    centerUf,
    centerMun: codeAt(map, center, PANEL_MAP_LAYER.indicatorFill),
  };
}

function describeMoveEnd(
  map: MaplibreMap,
  municipal: boolean,
  event: object,
  fittedZoom: number,
): PanelMapMoveEnd {
  return {
    zoom: map.getZoom(),
    ...centerCodes(map, municipal),
    programmatic: !isUserMove(event),
    fit: "panelMapFit" in event,
    fittedZoom,
  };
}

/**
 * Enquadramentos e fins de movimento. `programmatic` é tudo que não foi gesto
 * do usuário (fitTo, resize); `fit` só o fim de um fitTo; `fittedZoom` é o
 * zoom em que o último fitTo terminou.
 */
export function trackMoves(map: MaplibreMap, municipal: boolean) {
  let fittedZoom = map.getZoom();
  let listener: ((move: PanelMapMoveEnd) => void) | null = null;

  map.on("moveend", (event) => {
    if ("panelMapFit" in event) fittedZoom = map.getZoom();
    listener?.(describeMoveEnd(map, municipal, event, fittedZoom));
  });

  return {
    fitTo: (bbox: Bounds) => {
      map.fitBounds(bbox, { padding: 24, duration: 600 }, FIT_EVENT_DATA);
    },
    onMoveEnd: (callback: (move: PanelMapMoveEnd) => void) => {
      listener = callback;
    },
  };
}

// Uma feição com contorno de hover por vez; o id é o `code` (promoteId).
class FeatureHoverTracker {
  private hoveredId: FeatureId | null = null;
  listener: ((hover: PanelMapHover | null) => void) | null = null;

  constructor(private readonly map: MaplibreMap) {}

  readonly hover = (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];

    if (feature?.id === undefined) return this.clear();
    this.highlight(feature.id);
    this.listener?.({
      props: feature.properties as MapFeatureProps,
      x: event.point.x,
      y: event.point.y,
    });
  };

  readonly clear = () => {
    this.highlight(null);
    this.listener?.(null);
  };

  private highlight(id: FeatureId | null) {
    const { map, hoveredId } = this;
    const source = PANEL_MAP_SOURCE.features;

    if (hoveredId !== null && hoveredId !== id) {
      map.setFeatureState({ source, id: hoveredId }, { hover: false });
    }
    if (id !== null) map.setFeatureState({ source, id }, { hover: true });
    map.getCanvas().style.cursor = id === null ? "" : "pointer";
    this.hoveredId = id;
  }
}

/**
 * Hover nas feições do indicador: contorno escuro por feature-state, cursor de
 * clique e o callback com as propriedades e a posição (null ao sair).
 */
export function trackHover(map: MaplibreMap) {
  const tracker = new FeatureHoverTracker(map);

  map.on("mousemove", PANEL_MAP_LAYER.indicatorFill, tracker.hover);
  map.on("mouseleave", PANEL_MAP_LAYER.indicatorFill, tracker.clear);

  return {
    onHover: (callback: (hover: PanelMapHover | null) => void) => {
      tracker.listener = callback;
    },
  };
}

/** Clique numa feição do indicador → callback com as propriedades dela. */
export function trackFeatureClicks(map: MaplibreMap) {
  let listener: ((props: MapFeatureProps) => void) | null = null;

  map.on("click", PANEL_MAP_LAYER.indicatorFill, (event) => {
    const feature = event.features?.[0];

    if (feature) listener?.(feature.properties as MapFeatureProps);
  });

  return {
    onClickFeature: (callback: (props: MapFeatureProps) => void) => {
      listener = callback;
    },
  };
}
