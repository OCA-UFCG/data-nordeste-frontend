import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePanelMapFilters } from "@/components/PanelMap/usePanelMapFilters";
import { panelMapImageSource } from "@/components/PanelMap/panelMapTexts";
import type { TerritorialFilters } from "@/features/panels/territorialFilters";

const SELECTION: TerritorialFilters = {
  ano: 2021,
  area: "semiarido",
  uf: ["PB"],
  mun: ["2507507"],
};

describe("usePanelMapFilters", () => {
  it("shows the requested year, area and recorte straight from the selection", () => {
    const { result } = renderHook(() => usePanelMapFilters(SELECTION, vi.fn()));

    expect(result.current).toMatchObject({
      ano: 2021,
      area: "semiarido",
      recorte: { uf: ["PB"], mun: ["2507507"] },
    });
  });

  it("returns the emitted recorte to the panel as filters of the same selection", () => {
    const onFiltersChange = vi.fn();
    const { result } = renderHook(() =>
      usePanelMapFilters(SELECTION, onFiltersChange),
    );

    act(() => result.current.onRecorteChange({ uf: ["PE"], mun: [] }));

    expect(onFiltersChange).toHaveBeenCalledWith({
      ano: 2021,
      area: "semiarido",
      uf: ["PE"],
      mun: undefined,
    });
  });

  it("keeps the same recorte object while the selection does not change", () => {
    const { result, rerender } = renderHook(() =>
      usePanelMapFilters(SELECTION, vi.fn()),
    );
    const first = result.current.recorte;

    rerender();

    expect(result.current.recorte).toBe(first);
  });
});

describe("panelMapImageSource", () => {
  it("appends the Esri basemap credit to the card source", () => {
    expect(panelMapImageSource("Fonte: IBGE")).toBe(
      "Fonte: IBGE · Basemap: Esri",
    );
  });
});
