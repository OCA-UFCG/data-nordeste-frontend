import type { FeatureCollection } from "geojson";
import type { FilterSpecification, Map as MaplibreMap } from "maplibre-gl";
import { describe, expect, it, vi } from "vitest";

import { CLASS_MUTED_COLOR, veilFilters } from "@/features/panelMap/mapLayers";
import {
  applyClassHighlight,
  applyVeil,
  setAreaStatesData,
} from "@/lib/panelMap/panelMapPaint";
import {
  PANEL_MAP_LAYER,
  PANEL_MAP_SOURCE,
  panelMapStyle,
  VEIL_MATCHES_NOTHING,
} from "@/lib/panelMap/panelMapStyle";

/** Só o que as funções de pintura usam do MapLibre: layout, paint, filtro e fontes. */
class MaplibrePaintFake {
  readonly setLayoutProperty = vi.fn();
  readonly setPaintProperty = vi.fn();
  readonly setFilter = vi.fn();
  readonly sources = new Map<string, { setData: ReturnType<typeof vi.fn> }>();

  readonly getSource = (id: string) => {
    if (!this.sources.has(id)) this.sources.set(id, { setData: vi.fn() });

    return this.sources.get(id);
  };

  asMap(): MaplibreMap {
    return this as unknown as MaplibreMap;
  }
}

const IN_CLASS: FilterSpecification = [
  "in",
  ["get", "code"],
  ["literal", ["2611606"]],
];

const mutedLayer = () =>
  panelMapStyle("padrao", true).layers.find(
    (layer) => layer.id === PANEL_MAP_LAYER.classMuted,
  );

describe("camada do destaque da legenda", () => {
  // Decisão do usuário em 24/11/2026: cinza sólido, não véu translúcido.
  it("pinta o que fica fora da classe de cinza #e5e5e5", () => {
    expect(CLASS_MUTED_COLOR).toBe("#e5e5e5");
    expect(mutedLayer()).toMatchObject({
      type: "fill",
      layout: { visibility: "none" },
      paint: { "fill-color": "#e5e5e5" },
    });
  });

  it("fica sobre o preenchimento e sob o véu", () => {
    const ids = panelMapStyle("padrao", true).layers.map((layer) => layer.id);
    const muted = ids.indexOf(PANEL_MAP_LAYER.classMuted);

    expect(muted).toBe(ids.indexOf(PANEL_MAP_LAYER.indicatorFill) + 1);
    expect(muted).toBeLessThan(ids.indexOf(PANEL_MAP_LAYER.veilStates));
  });
});

describe("applyClassHighlight", () => {
  it("mostra a camada opaca fora da classe e transparente nela", () => {
    const map = new MaplibrePaintFake();

    applyClassHighlight(map.asMap(), IN_CLASS);

    expect(map.setLayoutProperty).toHaveBeenCalledWith(
      PANEL_MAP_LAYER.classMuted,
      "visibility",
      "visible",
    );
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      PANEL_MAP_LAYER.classMuted,
      "fill-opacity",
      ["case", IN_CLASS, 0, 1],
    );
  });

  it("null esconde a camada", () => {
    const map = new MaplibrePaintFake();

    applyClassHighlight(map.asMap(), null);

    expect(map.setLayoutProperty).toHaveBeenCalledWith(
      PANEL_MAP_LAYER.classMuted,
      "visibility",
      "none",
    );
    expect(map.setPaintProperty).not.toHaveBeenCalled();
  });
});

describe("estado escolhido recortado pela área", () => {
  it("o véu da parte de fora da área casa o estado escolhido", () => {
    const map = new MaplibrePaintFake();
    const veil = veilFilters({ uf: ["MG"], mun: [] }, "semiarido");

    applyVeil(map.asMap(), veil);

    expect(map.setFilter).toHaveBeenCalledWith(
      PANEL_MAP_LAYER.veilOutsideArea,
      ["in", ["get", "code"], ["literal", ["MG"]]],
    );
  });

  // Regressão: com a camada oculta, o MapLibre não carregava os tiles de
  // `area-states-outside` até o clique no estado, e durante o zoom a parte de
  // fora da área ficava sem véu (o estado parecia destacado por inteiro).
  it("sem estado escolhido, o véu casa nada e a camada continua visível", () => {
    const map = new MaplibrePaintFake();

    applyVeil(map.asMap(), veilFilters({ uf: [], mun: [] }, "semiarido"));

    [
      PANEL_MAP_LAYER.veilStates,
      PANEL_MAP_LAYER.veilOutsideArea,
      PANEL_MAP_LAYER.veilFeatures,
    ].forEach((layerId) =>
      expect(map.setFilter).toHaveBeenCalledWith(layerId, VEIL_MATCHES_NOTHING),
    );
    expect(map.setLayoutProperty).not.toHaveBeenCalled();
  });

  it("a parte de dentro vai para o hover e a seleção; a de fora, para o véu", () => {
    const map = new MaplibrePaintFake();
    const inside: FeatureCollection = {
      type: "FeatureCollection",
      features: [],
    };
    const outside: FeatureCollection = {
      type: "FeatureCollection",
      features: [],
    };

    setAreaStatesData(map.asMap(), { inside, outside });

    expect(
      map.sources.get(PANEL_MAP_SOURCE.areaStates)?.setData,
    ).toHaveBeenCalledWith(inside);
    expect(
      map.sources.get(PANEL_MAP_SOURCE.areaStatesOutside)?.setData,
    ).toHaveBeenCalledWith(outside);
  });
});
