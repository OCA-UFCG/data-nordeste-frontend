import type {
  IControl,
  NavigationControlOptions,
  RasterSourceSpecification,
  ScaleControlOptions,
} from "maplibre-gl";
import { describe, expect, it, vi } from "vitest";

import { basemapLayerId } from "@/lib/panelMap/basemaps";
import {
  addPanelMapControls,
  type PanelMapControlsModule,
  panelMapOptions,
} from "@/lib/panelMap/panelMapOptions";

function rasterSource(
  options: ReturnType<typeof panelMapOptions>,
  id: string,
): RasterSourceSpecification {
  const style = options.style;

  if (typeof style !== "object" || !style) {
    throw new Error(`Expected an inline style object, got "${String(style)}".`);
  }

  return style.sources[id] as RasterSourceSpecification;
}

const cardOptions = (cooperative: boolean) => ({
  basemap: "padrao" as const,
  cooperative,
  municipal: true,
});

describe("panelMapOptions", () => {
  const container = document.createElement("div");

  it("liga os gestos cooperativos só quando pedido (card × tela cheia)", () => {
    expect(
      panelMapOptions(container, cardOptions(true)).cooperativeGestures,
    ).toBe(true);
    expect(
      panelMapOptions(container, cardOptions(false)).cooperativeGestures,
    ).toBe(false);
  });

  it("traduz o aviso dos gestos cooperativos", () => {
    const { locale } = panelMapOptions(container, cardOptions(true));

    expect(locale["CooperativeGesturesHandler.WindowsHelpText"]).toContain(
      "Ctrl",
    );
  });

  it("traduz os botões de zoom, da bússola e dos créditos", () => {
    const { locale } = panelMapOptions(container, cardOptions(false));

    expect(locale).toMatchObject({
      "Map.Title": "Mapa",
      "AttributionControl.ToggleAttribution": "Mostrar ou ocultar os créditos",
      "NavigationControl.ZoomIn": "Aproximar",
      "NavigationControl.ZoomOut": "Afastar",
      "NavigationControl.ResetBearing": "Alinhar ao norte",
    });
  });

  // Gira (a bússola segue o giro), mas não inclina: sem 3D.
  it("deixa girar e trava a inclinação", () => {
    expect(panelMapOptions(container, cardOptions(true))).toMatchObject({
      dragRotate: true,
      pitchWithRotate: false,
      touchPitch: false,
      maxPitch: 0,
    });
  });

  // O duplo clique interromperia o enquadramento do clique numa feição.
  it("desliga o zoom por duplo clique e o box zoom", () => {
    expect(panelMapOptions(container, cardOptions(false))).toMatchObject({
      doubleClickZoom: false,
      boxZoom: false,
    });
  });

  it("o Padrão usa os ladrilhos do OpenStreetMap, que vão até o nível 19", () => {
    const options = panelMapOptions(container, cardOptions(true));
    const padrao = rasterSource(options, basemapLayerId("padrao"));

    expect(padrao.tiles).toEqual([
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    ]);
    expect(padrao.attribution).toBe("© OpenStreetMap contributors");
    expect(padrao.maxzoom).toBe(19);
    expect(
      rasterSource(options, basemapLayerId("satelite")).maxzoom,
    ).toBeUndefined();
  });
});

/** Construtores dos controles do MapLibre que só guardam as opções. */
class NavigationControlFake {
  constructor(readonly options: NavigationControlOptions) {}
}

class ScaleControlFake {
  constructor(readonly options: ScaleControlOptions) {}
}

const CONTROLS_MODULE = {
  NavigationControl: NavigationControlFake,
  ScaleControl: ScaleControlFake,
} as unknown as PanelMapControlsModule;

describe("addPanelMapControls", () => {
  const added = () => {
    const addControl = vi.fn<(control: IControl, position?: string) => void>();

    addPanelMapControls({ addControl } as never, CONTROLS_MODULE);

    return addControl.mock.calls;
  };

  it("põe +/− e a bússola, sem o indicador de inclinação, no canto superior direito", () => {
    const [control, position] = added()[0];

    expect(control).toBeInstanceOf(NavigationControlFake);
    expect((control as unknown as NavigationControlFake).options).toEqual({
      showCompass: true,
      visualizePitch: false,
    });
    expect(position).toBe("top-right");
  });

  it("põe a barra de escala métrica no canto inferior esquerdo", () => {
    const [control, position] = added()[1];

    expect(control).toBeInstanceOf(ScaleControlFake);
    expect((control as unknown as ScaleControlFake).options).toEqual({
      unit: "metric",
      maxWidth: 100,
    });
    expect(position).toBe("bottom-left");
  });
});
