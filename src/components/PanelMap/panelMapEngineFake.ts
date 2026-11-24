import { vi } from "vitest";

import type { MapFeatureProps } from "@/features/panelMap/geodataTypes";
import type { Bounds, FitSources } from "@/features/panelMap/mapLayers";
import type { ChartImageSource } from "@/lib/chartImage";
import type {
  AridezOverlay,
  BasemapKind,
  IndicatorPaint,
  PanelMapEngine,
  PanelMapEngineOptions,
  PanelMapHover,
  PanelMapMoveEnd,
  VeilFilters,
} from "@/lib/panelMapEngine";

type SelectionFilter = Parameters<PanelMapEngine["setSelection"]>[0];

/**
 * Motor do mapa para testes: grava as chamadas (vi.fn) e deixa o teste emitir
 * os eventos que o MapLibre emitiria (fim de movimento, hover, clique).
 *
 * @example const engine = new PanelMapEngineFake(); engine.emitMoveEnd({ zoom: 7, centerUf: "PE" });
 */
export class PanelMapEngineFake implements PanelMapEngine {
  private moveEndListener: ((move: PanelMapMoveEnd) => void) | null = null;
  private hoverListener: ((hover: PanelMapHover | null) => void) | null = null;
  private clickListener: ((props: MapFeatureProps | null) => void) | null =
    null;

  readonly setBasemap = vi.fn<(kind: BasemapKind) => void>();
  readonly setSources = vi.fn<(sources: FitSources) => void>();
  readonly setIndicatorPaint = vi.fn<(paint: IndicatorPaint) => void>();
  readonly setVeil = vi.fn<(veil: VeilFilters) => void>();
  readonly setSelection = vi.fn<(filter: SelectionFilter) => void>();
  readonly setClassHighlight = vi.fn<(filter: SelectionFilter) => void>();
  readonly setAridez = vi.fn<(overlay: AridezOverlay | null) => void>();
  readonly fitTo = vi.fn<(bbox: Bounds) => void>();
  readonly centerOn = vi.fn<(bbox: Bounds) => void>();
  readonly destroy = vi.fn<() => void>();

  readonly toImageSource = vi.fn(
    (): ChartImageSource => ({
      getDataURL: () => "data:image/png;base64,",
      getWidth: () => 640,
      getHeight: () => 480,
    }),
  );

  readonly onMoveEnd = vi.fn((callback: (move: PanelMapMoveEnd) => void) => {
    this.moveEndListener = callback;
  });

  readonly onHover = vi.fn(
    (callback: (hover: PanelMapHover | null) => void) => {
      this.hoverListener = callback;
    },
  );

  readonly onMapClick = vi.fn(
    (callback: (props: MapFeatureProps | null) => void) => {
      this.clickListener = callback;
    },
  );

  /**
   * Fim de movimento; por padrão um gesto do usuário com o último fit em zoom
   * 5. `fit: true` vale como programático, como no motor de verdade.
   */
  emitMoveEnd(move: Partial<PanelMapMoveEnd> & { zoom: number }): void {
    const programmatic = move.programmatic ?? move.fit ?? false;

    this.moveEndListener?.({
      fit: false,
      fittedZoom: 5,
      ...move,
      programmatic,
    });
  }

  emitHover(hover: PanelMapHover | null): void {
    this.hoverListener?.(hover);
  }

  /** Clique no mapa; `null` é um clique fora de qualquer feição. */
  emitClick(props: MapFeatureProps | null): void {
    this.clickListener?.(props);
  }
}

/**
 * `createPanelMapEngine` de mentira: entrega o motor fake no `onReady` na hora
 * e devolve um `teardown` espiável. Com `failure`, chama `onError` no lugar
 * (MapLibre que não carrega, navegador sem WebGL).
 *
 * @example render(<PanelMap {...props} createEngine={factory.create} />)
 */
export class PanelMapEngineFactoryFake {
  readonly engine = new PanelMapEngineFake();
  readonly teardown = vi.fn<() => void>();
  options: PanelMapEngineOptions | null = null;

  constructor(private readonly failure: Error | null = null) {}

  readonly create = vi.fn(
    (_container: HTMLElement, options: PanelMapEngineOptions) => {
      this.options = options;
      if (this.failure) options.onError(this.failure);
      else options.onReady(this.engine);

      return this.teardown;
    },
  );
}
