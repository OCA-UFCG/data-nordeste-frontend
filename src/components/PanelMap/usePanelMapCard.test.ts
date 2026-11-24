import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PanelMapEngineFake } from "@/components/PanelMap/panelMapEngineFake";
import { usePanelMapCard } from "@/components/PanelMap/usePanelMapCard";

const SOURCE = "Fonte: IBGE · Data Nordeste";

describe("usePanelMapCard", () => {
  it("credita o OpenStreetMap com o basemap padrão (Oceano)", () => {
    const { result } = renderHook(() => usePanelMapCard(SOURCE));

    expect(result.current.imageSource).toBe(
      `${SOURCE} · Basemap: © OpenStreetMap contributors`,
    );
  });

  it("com o satélite, a imagem credita Esri, Maxar e Earthstar", () => {
    const { result } = renderHook(() => usePanelMapCard(SOURCE));

    act(() => result.current.mapBinding.onBasemapChange("satelite"));

    expect(result.current.imageSource).toBe(
      `${SOURCE} · Basemap: Esri, Maxar, Earthstar Geographics`,
    );
  });

  // O corpo do card vira esqueleto/erro e o mapa remonta no Oceano.
  it("volta ao crédito do Oceano quando o mapa do card desmonta", () => {
    const { result } = renderHook(() => usePanelMapCard(SOURCE));

    act(() => result.current.mapBinding.onBasemapChange("satelite"));
    act(() => result.current.mapBinding.onEngine(null));

    expect(result.current.imageSource).toBe(
      `${SOURCE} · Basemap: © OpenStreetMap contributors`,
    );
  });

  it("guarda o motor do mapa do card e pede gestos cooperativos", () => {
    const { result } = renderHook(() => usePanelMapCard(SOURCE));
    const engine = new PanelMapEngineFake();

    act(() => result.current.mapBinding.onEngine(engine));

    expect(result.current.engine).toBe(engine);
    expect(result.current.mapBinding.cooperative).toBe(true);
  });
});
