import type {
  FeatureIdentifier,
  MapLayerMouseEvent,
  Map as MaplibreMap,
  PointLike,
} from "maplibre-gl";

import type { MapFeatureProps } from "@/features/panelMap/geodataTypes";
import { type Bounds, boundsCenter } from "@/features/panelMap/mapLayers";
import {
  PANEL_MAP_LAYER,
  PANEL_MAP_SOURCE,
} from "@/lib/panelMap/panelMapStyle";

export type PanelMapMoveEnd = {
  zoom: number;
  centerUf?: string;
  centerMun?: string;
  programmatic: boolean;

  // Só o fim de um fitTo ou centerOn. Um resize também é programático, mas não enquadrou.
  fit: boolean;
  fittedZoom: number;
};

export type PanelMapHover = { props: MapFeatureProps; x: number; y: number };

type FeatureId = FeatureIdentifier["id"];

// Marca os moveend do fitTo e do centerOn, só para registrar o fittedZoom. WHY eventData e
// não um flag: o flag fica preso quando o MapLibre não consegue enquadrar (sem
// moveend) e erra quando um fitTo interrompe outro.
const FIT_EVENT_DATA = { panelMapFit: true };

// Teto do enquadramento: um município pequeno não enche a tela inteira e
// ficaria ampliado demais.
const FIT_MAX_ZOOM = 10;
const CENTER_DURATION_MS = 600;

// IMPORTANT: só gesto do usuário vira filtro. Arrastar, roda do mouse, toque,
// teclado e os botões +/− mandam `originalEvent` no moveend; o
// fitTo e o resize do container (ResizeObserver → map.resize) não. Sem isto,
// redimensionar a janela viraria um recorte que ninguém escolheu.
function isUserMove(event: object): boolean {
  return "originalEvent" in event;
}

function indicatorFeatureAt(
  map: MaplibreMap,
  point: PointLike,
): MapFeatureProps | undefined {
  const [feature] = map.queryRenderedFeatures(point, {
    layers: [PANEL_MAP_LAYER.indicatorFill],
  });

  return feature?.properties as MapFeatureProps | undefined;
}

/**
 * UF (e, com feições municipais, o município) sob o centro do mapa.
 *
 * IMPORTANT: os dois códigos vêm da MESMA feição do indicador, cuja camada já
 * está filtrada pela área do painel; assim o código emitido sempre existe nas
 * opções do servidor. Fora da área ou no mar não há feição e o recorte fica
 * como está. Antes a UF vinha de uma camada com os 27 estados: zoom sobre MG
 * (ou na divisa PE/PB) emitia um código que o servidor descarta (`keepKnown`)
 * e o mapa voltava para a área inteira.
 */
function centerCodes(map: MaplibreMap, municipal: boolean) {
  const props = indicatorFeatureAt(map, map.project(map.getCenter()));

  if (!props) return {};
  if (!municipal) return { centerUf: String(props.code) };

  return { centerUf: String(props.uf), centerMun: String(props.code) };
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
 * do usuário (fitTo, centerOn, resize); `fit` só o fim de um fitTo ou centerOn;
 * `fittedZoom` é o zoom em que o último deles terminou (no centerOn, o atual).
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
      map.fitBounds(
        bbox,
        { padding: 24, duration: 600, maxZoom: FIT_MAX_ZOOM },
        FIT_EVENT_DATA,
      );
    },
    centerOn: (bbox: Bounds) => {
      map.easeTo(
        { center: boundsCenter(bbox), duration: CENTER_DURATION_MS },
        FIT_EVENT_DATA,
      );
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

/**
 * Todo clique no mapa → callback com as propriedades da feição do indicador
 * sob o cursor, ou `null` quando não há (mar, fora da área, véu sem feição).
 * O `click` do MapLibre já ignora arrastos e não dispara em moves programáticos.
 */
export function trackMapClicks(map: MaplibreMap) {
  let listener: ((props: MapFeatureProps | null) => void) | null = null;

  map.on("click", (event) => {
    listener?.(indicatorFeatureAt(map, event.point) ?? null);
  });

  return {
    onMapClick: (callback: (props: MapFeatureProps | null) => void) => {
      listener = callback;
    },
  };
}
