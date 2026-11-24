import { describe, expect, it } from "vitest";

import { MUNICIPALITY_ZOOM, STATE_ZOOM } from "@/features/panelMap/mapRecorte";
import { PANEL_MAP_LAYER, panelMapStyle } from "@/lib/panelMap/panelMapStyle";

// minzoom de cada camada acima dos basemaps (undefined = qualquer zoom).
const minZooms = (municipal: boolean) =>
  Object.fromEntries(
    panelMapStyle("padrao", municipal).layers.map((layer) => [
      layer.id,
      layer.minzoom,
    ]),
  );

const ALWAYS_VISIBLE = [
  PANEL_MAP_LAYER.indicatorFill,
  PANEL_MAP_LAYER.classMuted,
  PANEL_MAP_LAYER.veilStates,
  PANEL_MAP_LAYER.veilFeatures,
  PANEL_MAP_LAYER.areaOutline,
  PANEL_MAP_LAYER.selectionFeatures,
  PANEL_MAP_LAYER.selectionStates,
];

describe("limites conforme o zoom", () => {
  it("com municípios: estados a partir do nível estado, municípios do nível município", () => {
    const zooms = minZooms(true);

    expect(zooms[PANEL_MAP_LAYER.stateOutline]).toBe(STATE_ZOOM);
    expect(zooms[PANEL_MAP_LAYER.featureOutline]).toBe(MUNICIPALITY_ZOOM);
    expect(zooms[PANEL_MAP_LAYER.featureHover]).toBe(MUNICIPALITY_ZOOM);
  });

  it("com feições de estado (IDH, Estados): os contornos seguem o nível estado", () => {
    const zooms = minZooms(false);

    expect(zooms[PANEL_MAP_LAYER.stateOutline]).toBe(STATE_ZOOM);
    expect(zooms[PANEL_MAP_LAYER.featureOutline]).toBe(STATE_ZOOM);
    expect(zooms[PANEL_MAP_LAYER.featureHover]).toBeUndefined();
  });

  it("área de interesse, classes, véu e seleção aparecem em qualquer zoom", () => {
    [true, false].forEach((municipal) => {
      const zooms = minZooms(municipal);

      ALWAYS_VISIBLE.forEach((id) => expect(zooms[id]).toBeUndefined());
    });
  });

  it("os limiares são os do recorte pelo zoom", () => {
    expect([STATE_ZOOM, MUNICIPALITY_ZOOM]).toEqual([6.5, 8.5]);
  });
});
