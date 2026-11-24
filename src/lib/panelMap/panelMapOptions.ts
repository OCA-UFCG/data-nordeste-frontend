import type { MapOptions } from "maplibre-gl";

import type { Bounds } from "@/features/panelMap/mapLayers";
import type { BasemapKind } from "@/lib/panelMap/basemaps";
import { panelMapStyle } from "@/lib/panelMap/panelMapStyle";

// Vista antes do primeiro fitTo: o Nordeste inteiro.
const NORDESTE_BOUNDS: Bounds = [
  [-48.8, -18.4],
  [-34.8, -1.0],
];

// Sem rotação nem inclinação. Sem box zoom (shift+arrastar): o moveend dele
// não traz `originalEvent` e seria lido como movimento programático.
// WHY sem duplo clique: o clique numa feição já enquadra o recorte dela, e o
// zoom do duplo clique interromperia esse enquadramento no meio.
const LOCKED_GESTURES = {
  dragRotate: false,
  pitchWithRotate: false,
  touchPitch: false,
  boxZoom: false,
  doubleClickZoom: false,
} satisfies Partial<MapOptions>;

// Aviso do MapLibre quando o gesto cooperativo bloqueia a roda ou um dedo.
const COOPERATIVE_GESTURES_LOCALE = {
  "CooperativeGesturesHandler.WindowsHelpText":
    "Use Ctrl + roda do mouse para ampliar o mapa",
  "CooperativeGesturesHandler.MacHelpText":
    "Use ⌘ + roda do mouse para ampliar o mapa",
  "CooperativeGesturesHandler.MobileHelpText":
    "Use dois dedos para mover o mapa",
};

/**
 * Opções do `new maplibre.Map` dos painéis. `cooperative` liga os gestos
 * cooperativos (Ctrl/⌘ + roda, dois dedos no toque) para o mapa dentro do
 * card não sequestrar a rolagem da página; a tela cheia usa os gestos normais.
 *
 * @example new maplibre.Map(panelMapOptions(div, "padrao", true))
 */
export function panelMapOptions(
  container: HTMLElement,
  basemap: BasemapKind,
  cooperative: boolean,
): MapOptions {
  return {
    container,
    style: panelMapStyle(basemap),
    bounds: NORDESTE_BOUNDS,

    // IMPORTANT: sem isto o toDataURL do "Baixar imagem" sai em branco.
    preserveDrawingBuffer: true,
    attributionControl: { compact: true },
    cooperativeGestures: cooperative,
    locale: COOPERATIVE_GESTURES_LOCALE,
    ...LOCKED_GESTURES,
  };
}
