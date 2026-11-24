import { describe, expect, it } from "vitest";

import {
  MUNICIPAL_LINES_ZOOM,
  MUNICIPALITY_ZOOM,
  STATE_ZOOM,
} from "@/features/panelMap/mapRecorte";
import {
  PANEL_MAP_LAYER,
  PANEL_MAP_SOURCE,
  panelMapStyle,
} from "@/lib/panelMap/panelMapStyle";

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
  PANEL_MAP_LAYER.veilSelectedStates,
  PANEL_MAP_LAYER.veilStates,
  PANEL_MAP_LAYER.veilFeatures,
  PANEL_MAP_LAYER.areaOutline,
  PANEL_MAP_LAYER.featureHover,
  PANEL_MAP_LAYER.stateHover,
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

describe("contornos de hover", () => {
  const layerById = (id: string) =>
    panelMapStyle("padrao", true).layers.find((layer) => layer.id === id);

  it("há um por fonte: o das feições e o dos estados recortados pela área", () => {
    const featureHover = layerById(PANEL_MAP_LAYER.featureHover);
    const stateHover = layerById(PANEL_MAP_LAYER.stateHover);

    expect(featureHover).toMatchObject({ source: "features" });
    expect(stateHover).toMatchObject({ source: PANEL_MAP_SOURCE.areaStates });
    expect(stateHover?.paint).toEqual(featureHover?.paint);
  });

  it("o hover dos estados fica acima do contorno estadual", () => {
    const ids = panelMapStyle("padrao", true).layers.map((layer) => layer.id);

    expect(ids.indexOf(PANEL_MAP_LAYER.stateHover)).toBeGreaterThan(
      ids.indexOf(PANEL_MAP_LAYER.stateOutline),
    );
  });
});

describe("estado recortado pela área de interesse", () => {
  const layers = () => panelMapStyle("padrao", true).layers;
  const layerById = (id: string) => layers().find((layer) => layer.id === id);
  const ids = () => layers().map((layer) => layer.id);

  it("a seleção de estado usa a parte dentro da área; o contorno estadual, o estado inteiro", () => {
    expect(layerById(PANEL_MAP_LAYER.selectionStates)).toMatchObject({
      source: PANEL_MAP_SOURCE.areaStates,
    });
    expect(layerById(PANEL_MAP_LAYER.stateOutline)).toMatchObject({
      source: PANEL_MAP_SOURCE.states,
    });
    expect(panelMapStyle("padrao", true).sources).toHaveProperty(
      PANEL_MAP_SOURCE.areaStates,
      expect.objectContaining({ type: "geojson", promoteId: "code" }),
    );
  });

  // O preenchimento da área (e o raster da aridez, que entra logo abaixo do
  // preenchimento) fica por cima: só a parte de fora do estado fica cinza.
  it("o véu do estado escolhido é o estado inteiro, logo abaixo do preenchimento", () => {
    expect(layerById(PANEL_MAP_LAYER.veilSelectedStates)).toMatchObject({
      type: "fill",
      source: PANEL_MAP_SOURCE.states,
      layout: { visibility: "none" },
    });
    expect(ids().indexOf(PANEL_MAP_LAYER.veilSelectedStates)).toBe(
      ids().indexOf(PANEL_MAP_LAYER.indicatorFill) - 1,
    );
  });
});
