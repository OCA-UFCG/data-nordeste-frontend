import { describe, expect, it } from "vitest";

import {
  MUNICIPAL_LINES_ZOOM,
  MUNICIPALITY_ZOOM,
  STATE_ZOOM,
} from "@/features/panelMap/mapRecorte";
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
  PANEL_MAP_LAYER.featureHover,
  PANEL_MAP_LAYER.selectionFeatures,
  PANEL_MAP_LAYER.selectionStates,
];

describe("limites conforme o zoom", () => {
  it("com municípios: estados em qualquer zoom e municípios um nível antes do filtro", () => {
    const zooms = minZooms(true);

    expect(zooms[PANEL_MAP_LAYER.stateOutline]).toBeUndefined();
    expect(zooms[PANEL_MAP_LAYER.featureOutline]).toBe(MUNICIPAL_LINES_ZOOM);
  });

  it("com feições de estado (IDH, Estados): o contorno delas aparece em qualquer zoom", () => {
    const zooms = minZooms(false);

    expect(zooms[PANEL_MAP_LAYER.stateOutline]).toBeUndefined();
    expect(zooms[PANEL_MAP_LAYER.featureOutline]).toBeUndefined();
  });

  it("área de interesse, classes, hover, véu e seleção aparecem em qualquer zoom", () => {
    [true, false].forEach((municipal) => {
      const zooms = minZooms(municipal);

      ALWAYS_VISIBLE.forEach((id) => expect(zooms[id]).toBeUndefined());
    });
  });

  it("o limite municipal aparece um nível antes do limiar do filtro", () => {
    expect([STATE_ZOOM, MUNICIPALITY_ZOOM]).toEqual([6.5, 8.5]);
    expect(MUNICIPAL_LINES_ZOOM).toBe(7.5);
  });
});
