import type { Map as MaplibreMap, MapOptions } from "maplibre-gl";

import type { Bounds } from "@/features/panelMap/mapLayers";
import type { BasemapKind } from "@/lib/panelMap/basemaps";
import { panelMapStyle } from "@/lib/panelMap/panelMapStyle";

// Vista antes do primeiro fitTo: o Nordeste inteiro.
const NORDESTE_BOUNDS: Bounds = [
  [-48.8, -18.4],
  [-34.8, -1.0],
];

// Gira (botão direito ou Ctrl + arrastar, dois dedos no toque; a bússola
// volta ao norte), mas não inclina: sem 3D, o centro e o zoom continuam
// dizendo o recorte. WHY girar não quebra o recorte: o moveend do giro traz
// `originalEvent` (é gesto do usuário) e o resolveRecorte só olha zoom e
// centro, que o giro não muda. Sem box zoom (shift+arrastar): o moveend dele
// não traz `originalEvent` e seria lido como movimento programático.
// WHY sem duplo clique: o clique numa feição já enquadra o recorte dela, e o
// zoom do duplo clique interromperia esse enquadramento no meio.
const LOCKED_GESTURES = {
  dragRotate: true,
  pitchWithRotate: false,
  touchPitch: false,
  maxPitch: 0,
  boxZoom: false,
  doubleClickZoom: false,
} satisfies Partial<MapOptions>;

// Textos do MapLibre em português: o aviso do gesto cooperativo (roda ou um
// dedo bloqueados), os títulos dos botões de zoom, da bússola e dos créditos,
// e o rótulo do canvas. A escala usa "m"/"km", iguais em português.
const PANEL_MAP_LOCALE = {
  "Map.Title": "Mapa",
  "AttributionControl.ToggleAttribution": "Mostrar ou ocultar os créditos",
  "CooperativeGesturesHandler.WindowsHelpText":
    "Use Ctrl + roda do mouse para ampliar o mapa",
  "CooperativeGesturesHandler.MacHelpText":
    "Use ⌘ + roda do mouse para ampliar o mapa",
  "CooperativeGesturesHandler.MobileHelpText":
    "Use dois dedos para mover o mapa",
  "NavigationControl.ZoomIn": "Aproximar",
  "NavigationControl.ZoomOut": "Afastar",
  "NavigationControl.ResetBearing": "Alinhar ao norte",
};

export type PanelMapOptionsInput = {
  basemap: BasemapKind;
  cooperative: boolean;
  municipal: boolean;
};

/**
 * Opções do `new maplibre.Map` dos painéis. `cooperative` liga os gestos
 * cooperativos (Ctrl/⌘ + roda, dois dedos no toque) para o mapa dentro do
 * card não sequestrar a rolagem da página; a tela cheia usa os gestos normais.
 * `municipal` vai para o estilo (zoom dos contornos das feições).
 *
 * @example new maplibre.Map(panelMapOptions(div, { basemap: "padrao", cooperative: true, municipal: true }))
 */
export function panelMapOptions(
  container: HTMLElement,
  { basemap, cooperative, municipal }: PanelMapOptionsInput,
): MapOptions {
  return {
    container,
    style: panelMapStyle(basemap, municipal),
    bounds: NORDESTE_BOUNDS,

    // IMPORTANT: sem isto o toDataURL do "Baixar imagem" sai em branco.
    preserveDrawingBuffer: true,
    attributionControl: { compact: true },
    cooperativeGestures: cooperative,
    locale: PANEL_MAP_LOCALE,
    ...LOCKED_GESTURES,
  };
}

export type PanelMapControlsModule = Pick<
  typeof import("maplibre-gl"),
  "NavigationControl" | "ScaleControl"
>;

/**
 * Elementos cartográficos de todo mapa dos painéis: +/− e bússola no canto
 * superior direito (a agulha segue o giro; o clique volta ao norte) e a
 * barra de escala no inferior esquerdo, longe do crédito compacto (inferior
 * direito); a legenda fica fora do quadro, abaixo do mapa.
 *
 * @example addPanelMapControls(map, await import("maplibre-gl"))
 */
export function addPanelMapControls(
  map: Pick<MaplibreMap, "addControl">,
  maplibre: PanelMapControlsModule,
): void {
  map.addControl(
    new maplibre.NavigationControl({
      showCompass: true,
      visualizePitch: false,
    }),
    "top-right",
  );
  map.addControl(
    new maplibre.ScaleControl({ unit: "metric", maxWidth: 100 }),
    "bottom-left",
  );
}
