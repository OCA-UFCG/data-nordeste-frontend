import type { Map as MaplibreMap, PointLike } from "maplibre-gl";

import type { MapFeatureProps } from "@/features/panelMap/geodataTypes";
import type { Bounds } from "@/features/panelMap/mapLayers";
import { PANEL_MAP_LAYER } from "@/lib/panelMap/panelMapStyle";

export type PanelMapMoveEnd = {
  zoom: number;
  centerUf?: string;
  centerMun?: string;
  programmatic: boolean;

  // Só o fim de um fitTo. Um resize também é programático, mas não enquadrou.
  fit: boolean;
  fittedZoom: number;
};

// Marca os moveend do fitTo, só para registrar o fittedZoom. WHY eventData e
// não um flag: o flag fica preso quando o MapLibre não consegue enquadrar (sem
// moveend) e erra quando um fitTo interrompe outro.
const FIT_EVENT_DATA = { panelMapFit: true };

// Teto do enquadramento: um município pequeno não enche a tela inteira e
// ficaria ampliado demais.
const FIT_MAX_ZOOM = 10;

// IMPORTANT: só gesto do usuário vira filtro. Arrastar, girar, roda do mouse,
// toque, teclado, os botões +/− e a bússola mandam `originalEvent` no
// moveend (girar não muda zoom nem centro, então o recorte fica); o
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

  // WHY bearing: o `fitBounds` sem ele volta o mapa para o norte; quem girou
  // o mapa mantém o giro (o norte volta pela bússola).
  return {
    fitTo: (bbox: Bounds) => {
      map.fitBounds(
        bbox,
        {
          padding: 24,
          duration: 600,
          maxZoom: FIT_MAX_ZOOM,
          bearing: map.getBearing(),
        },
        FIT_EVENT_DATA,
      );
    },
    onMoveEnd: (callback: (move: PanelMapMoveEnd) => void) => {
      listener = callback;
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
