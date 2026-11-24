import type { MapLayerMouseEvent, Map as MaplibreMap } from "maplibre-gl";
import { describe, expect, it, vi } from "vitest";

import type { MapFeatureProps } from "@/features/panelMap/geodataTypes";
import { type PanelMapHover, trackHover } from "@/lib/panelMap/panelMapHover";
import {
  PANEL_MAP_LAYER,
  PANEL_MAP_SOURCE,
} from "@/lib/panelMap/panelMapStyle";

type LayerListener = (event: MapLayerMouseEvent) => void;

type FeatureStateCall = [{ source: string; id: string }, { hover: boolean }];

const RECIFE: MapFeatureProps = { code: "2611606", name: "Recife", uf: "PE" };

/**
 * Só o que `trackHover` usa do MapLibre: os eventos de ponteiro da camada do
 * indicador, o feature-state e o cursor do canvas.
 */
class MaplibreHoverFake {
  readonly canvas = { style: { cursor: "" } };
  private readonly listeners = new Map<string, LayerListener>();

  readonly on = vi.fn(
    (type: string, layer: string, callback: LayerListener) => {
      this.listeners.set(`${type}:${layer}`, callback);
    },
  );
  readonly setFeatureState = vi.fn<(...args: FeatureStateCall) => void>();
  readonly getCanvas = () => this.canvas;

  pointAt(props: MapFeatureProps): void {
    const event = {
      features: [{ id: props.code, properties: props }],
      point: { x: 10, y: 20 },
    };

    this.fire("mousemove", event);
  }

  leave(): void {
    this.fire("mouseleave", {});
  }

  lastState(): FeatureStateCall | undefined {
    return this.setFeatureState.mock.calls.at(-1);
  }

  asMap(): MaplibreMap {
    return this as unknown as MaplibreMap;
  }

  private fire(type: string, event: object): void {
    const key = `${type}:${PANEL_MAP_LAYER.indicatorFill}`;

    this.listeners.get(key)?.(event as MapLayerMouseEvent);
  }
}

function trackedHover() {
  const map = new MaplibreHoverFake();
  const hovers: (PanelMapHover | null)[] = [];
  const tracker = trackHover(map.asMap());

  tracker.onHover((hover) => hovers.push(hover));

  return { map, hovers, tracker };
}

describe("trackHover", () => {
  it("por padrão acende a feição do indicador e a entrega com o nível", () => {
    const { map, hovers } = trackedHover();

    map.pointAt(RECIFE);

    expect(map.lastState()).toEqual([
      { source: PANEL_MAP_SOURCE.features, id: "2611606" },
      { hover: true },
    ]);
    expect(hovers.at(-1)).toEqual({
      level: "feicao",
      props: RECIFE,
      x: 10,
      y: 20,
    });
    expect(map.canvas.style.cursor).toBe("pointer");
  });

  it("no nível estado acende o estado do município, na fonte dos estados", () => {
    const { map, hovers, tracker } = trackedHover();

    tracker.setHoverLevel("estado");
    map.pointAt(RECIFE);

    expect(map.lastState()).toEqual([
      { source: PANEL_MAP_SOURCE.states, id: "PE" },
      { hover: true },
    ]);
    expect(hovers.at(-1)).toMatchObject({
      level: "estado",
      props: { code: "PE", uf: "PE" },
    });
  });

  // O clique no estado troca o nível com o ponteiro ainda sobre o mapa.
  it("trocar o nível apaga o contorno da fonte antiga e o tooltip", () => {
    const { map, hovers, tracker } = trackedHover();

    tracker.setHoverLevel("estado");
    map.pointAt(RECIFE);
    tracker.setHoverLevel("feicao");

    expect(map.lastState()).toEqual([
      { source: PANEL_MAP_SOURCE.states, id: "PE" },
      { hover: false },
    ]);
    expect(hovers.at(-1)).toBeNull();
    expect(map.canvas.style.cursor).toBe("");
  });

  it("repetir o mesmo nível não apaga nada", () => {
    const { map, hovers, tracker } = trackedHover();

    map.pointAt(RECIFE);
    tracker.setHoverLevel("feicao");

    expect(hovers.at(-1)).not.toBeNull();
    expect(map.setFeatureState).toHaveBeenCalledTimes(1);
  });

  it("sair das feições apaga o contorno e avisa com null", () => {
    const { map, hovers } = trackedHover();

    map.pointAt(RECIFE);
    map.leave();

    expect(map.lastState()?.[1]).toEqual({ hover: false });
    expect(hovers.at(-1)).toBeNull();
  });
});
