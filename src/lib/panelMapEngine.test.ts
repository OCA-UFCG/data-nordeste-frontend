import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createPanelMapEngine,
  type PanelMapEngineOptions,
} from "@/lib/panelMapEngine";

type Listener = () => void;

/**
 * Só o que `createPanelMapEngine` usa do MapLibre no `new Map` e na montagem.
 * `fire` dispara os eventos `once` registrados, como o mapa real faria.
 */
class MaplibreMountFake {
  static last: MaplibreMountFake;
  readonly touchZoomRotate = { disableRotation: vi.fn() };
  readonly addControl = vi.fn();
  readonly remove = vi.fn();
  readonly on = vi.fn();
  readonly getZoom = () => 5;
  private readonly listeners = new Map<string, Listener[]>();

  constructor() {
    MaplibreMountFake.last = this;
  }

  readonly once = vi.fn((type: string, callback: Listener) => {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), callback]);
  });

  fire(type: string): void {
    this.listeners.get(type)?.forEach((callback) => callback());
  }
}

class NavigationControlFake {}

vi.mock("maplibre-gl", () => ({
  Map: MaplibreMountFake,
  NavigationControl: NavigationControlFake,
}));

const CONTAINER = document.createElement("div");

function engineOptions(
  onReady: PanelMapEngineOptions["onReady"],
): PanelMapEngineOptions {
  return {
    basemap: "padrao",
    municipal: true,
    cooperative: true,
    onReady,
    onError: vi.fn(),
  };
}

async function mountEngine() {
  const onReady = vi.fn<PanelMapEngineOptions["onReady"]>();
  const destroy = createPanelMapEngine(CONTAINER, engineOptions(onReady));

  await vi.waitFor(() => expect(MaplibreMountFake.last).toBeDefined());
  await vi.waitFor(() =>
    expect(MaplibreMountFake.last.once).toHaveBeenCalled(),
  );

  return { map: MaplibreMountFake.last, onReady, destroy };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("createPanelMapEngine", () => {
  // O `load` espera os ladrilhos do basemap; o mapa ficava sem coropleta por
  // segundos mesmo com o estilo e as camadas prontos.
  it("fica pronto quando o estilo carrega, sem esperar o load dos ladrilhos", async () => {
    const { map, onReady } = await mountEngine();

    expect(onReady).not.toHaveBeenCalled();

    map.fire("style.load");

    expect(onReady).toHaveBeenCalledTimes(1);
    expect(map.once).not.toHaveBeenCalledWith("load", expect.anything());
  });

  it("não chama onReady se o mapa foi desmontado antes do estilo", async () => {
    const { map, onReady, destroy } = await mountEngine();

    destroy();
    map.fire("style.load");

    expect(map.remove).toHaveBeenCalledTimes(1);
    expect(onReady).not.toHaveBeenCalled();
  });
});
