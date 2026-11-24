import type { FilterSpecification, Map as MaplibreMap } from "maplibre-gl";
import { describe, expect, it, vi } from "vitest";

import { CLASS_MUTED_COLOR } from "@/features/panelMap/mapLayers";
import { applyClassHighlight } from "@/lib/panelMap/panelMapPaint";
import { PANEL_MAP_LAYER, panelMapStyle } from "@/lib/panelMap/panelMapStyle";

/** Só o que `applyClassHighlight` usa do MapLibre: layout e paint da camada. */
class MaplibrePaintFake {
  readonly setLayoutProperty = vi.fn();
  readonly setPaintProperty = vi.fn();

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
  panelMapStyle("padrao").layers.find(
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
    const ids = panelMapStyle("padrao").layers.map((layer) => layer.id);
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
