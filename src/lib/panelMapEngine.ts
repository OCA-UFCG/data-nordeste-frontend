import "maplibre-gl/dist/maplibre-gl.css";
import type {
  FilterSpecification,
  Map as MaplibreMap,
  MapOptions,
} from "maplibre-gl";

import type { MapFeatureProps } from "@/features/panelMap/geodataTypes";
import type { Bounds, FitSources } from "@/features/panelMap/mapLayers";
import { type ChartImageSource, canvasImageSource } from "@/lib/chartImage";
import type { BasemapKind } from "@/lib/panelMap/basemaps";
import { type AridezOverlay, showAridez } from "@/lib/panelMap/panelMapAridez";
import {
  type PanelMapHover,
  type PanelMapMoveEnd,
  trackFeatureClicks,
  trackHover,
  trackMoves,
} from "@/lib/panelMap/panelMapInteraction";
import {
  applySelection,
  applyVeil,
  type IndicatorPaint,
  paintIndicator,
  setSourceData,
  showBasemap,
  type VeilFilters,
} from "@/lib/panelMap/panelMapPaint";
import { panelMapStyle } from "@/lib/panelMap/panelMapStyle";

export { BASEMAPS, type BasemapKind } from "@/lib/panelMap/basemaps";
export type { AridezOverlay } from "@/lib/panelMap/panelMapAridez";
export type {
  PanelMapHover,
  PanelMapMoveEnd,
} from "@/lib/panelMap/panelMapInteraction";
export type { IndicatorPaint, VeilFilters } from "@/lib/panelMap/panelMapPaint";

type MaplibreModule = typeof import("maplibre-gl");

/**
 * O mapa dos painéis visto pelos componentes. Só este módulo (e
 * `src/lib/panelMap/`) conhece o MapLibre. Os `on*` guardam um callback cada:
 * registrar de novo substitui o anterior.
 */
export interface PanelMapEngine {
  setBasemap(kind: BasemapKind): void;
  setSources(sources: FitSources): void;
  setIndicatorPaint(paint: IndicatorPaint): void;
  setVeil(veil: VeilFilters): void;
  setSelection(filter: FilterSpecification | null): void;
  setAridez(overlay: AridezOverlay | null): void;
  fitTo(bbox: Bounds): void;
  onMoveEnd(callback: (move: PanelMapMoveEnd) => void): void;
  onHover(callback: (hover: PanelMapHover | null) => void): void;
  onClickFeature(callback: (props: MapFeatureProps) => void): void;
  toImageSource(): ChartImageSource;
  destroy(): void;
}

export type PanelMapEngineOptions = {
  basemap: BasemapKind;

  // Feições do indicador são municípios (PIB, Demografia) ou estados (IDH).
  municipal: boolean;
  onReady: (engine: PanelMapEngine) => void;
};

// Vista antes do primeiro fitTo: o Nordeste inteiro.
const NORDESTE_BOUNDS: Bounds = [
  [-48.8, -18.4],
  [-34.8, -1.0],
];

// Sem rotação nem inclinação. Sem box zoom (shift+arrastar): o moveend dele
// não traz `originalEvent` e seria lido como movimento programático.
const LOCKED_GESTURES = {
  dragRotate: false,
  pitchWithRotate: false,
  touchPitch: false,
  boxZoom: false,
} satisfies Partial<MapOptions>;

function panelMapOptions(
  container: HTMLElement,
  basemap: BasemapKind,
): MapOptions {
  return {
    container,
    style: panelMapStyle(basemap),
    bounds: NORDESTE_BOUNDS,

    // IMPORTANT: sem isto o toDataURL do "Baixar imagem" sai em branco.
    preserveDrawingBuffer: true,
    attributionControl: { compact: true },
    ...LOCKED_GESTURES,
  };
}

function createMap(
  maplibre: MaplibreModule,
  container: HTMLElement,
  basemap: BasemapKind,
): MaplibreMap {
  const map = new maplibre.Map(panelMapOptions(container, basemap));

  map.touchZoomRotate.disableRotation();
  map.addControl(new maplibre.NavigationControl({ showCompass: false }));

  return map;
}

type PanelMapPaintControls = Pick<
  PanelMapEngine,
  | "setBasemap"
  | "setSources"
  | "setIndicatorPaint"
  | "setVeil"
  | "setSelection"
  | "setAridez"
>;

function paintControls(map: MaplibreMap): PanelMapPaintControls {
  return {
    setBasemap: (kind) => showBasemap(map, kind),
    setSources: (sources) => setSourceData(map, sources),
    setIndicatorPaint: (paint) => paintIndicator(map, paint),
    setVeil: (veil) => applyVeil(map, veil),
    setSelection: (filter) => applySelection(map, filter),
    setAridez: (overlay) => showAridez(map, overlay),
  };
}

function engineFor(
  map: MaplibreMap,
  municipal: boolean,
  destroy: () => void,
): PanelMapEngine {
  const moves = trackMoves(map, municipal);

  return {
    ...paintControls(map),
    fitTo: moves.fitTo,
    onMoveEnd: moves.onMoveEnd,
    onHover: trackHover(map).onHover,
    onClickFeature: trackFeatureClicks(map).onClickFeature,
    toImageSource: () => canvasImageSource(map.getCanvas()),
    destroy,
  };
}

function logEngineFailure(error: unknown): void {
  console.error(
    JSON.stringify({
      event: "panel_map_engine_failed",
      message: error instanceof Error ? error.message : String(error),
    }),
  );
}

// O import do MapLibre é assíncrono: o efeito do React pode desmontar antes.
type EngineMount = { map: MaplibreMap | null; destroyed: boolean };

function mountMap(
  maplibre: MaplibreModule,
  container: HTMLElement,
  options: PanelMapEngineOptions,
  mount: EngineMount,
  destroy: () => void,
): void {
  if (mount.destroyed) return;
  const map = createMap(maplibre, container, options.basemap);

  mount.map = map;
  map.once("load", () => {
    if (!mount.destroyed) {
      options.onReady(engineFor(map, options.municipal, destroy));
    }
  });
}

/**
 * Cria o mapa no `container` e chama `onReady` quando o estilo carregou (as
 * camadas existem). O MapLibre é importado aqui dentro, só no navegador — o
 * módulo pode ser importado na renderização do servidor. Devolve a função que
 * desmonta o mapa, mesmo antes do `onReady` (efeito do React desmontado cedo).
 *
 * @example useEffect(() => createPanelMapEngine(div, { basemap: "oceano", municipal: true, onReady: setEngine }), [])
 */
export function createPanelMapEngine(
  container: HTMLElement,
  options: PanelMapEngineOptions,
): () => void {
  const mount: EngineMount = { map: null, destroyed: false };
  const destroy = () => {
    if (!mount.destroyed) mount.map?.remove();
    mount.destroyed = true;
  };

  import("maplibre-gl")
    .then((maplibre) => mountMap(maplibre, container, options, mount, destroy))
    .catch(logEngineFailure);

  return destroy;
}
