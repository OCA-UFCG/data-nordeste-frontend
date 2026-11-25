import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PanelMapEngineFake } from "@/components/PanelMap/panelMapEngineFake";
import { usePanelMapCard } from "@/components/PanelMap/usePanelMapCard";

const SOURCE = "Fonte: IBGE · Data Nordeste";

describe("usePanelMapCard", () => {
  it("credita o OpenStreetMap com o basemap padrão (Padrão)", () => {
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

  // O corpo do card vira esqueleto/erro e o mapa remonta no Padrão.
  it("volta ao crédito do Padrão quando o mapa do card desmonta", () => {
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

  // A tela cheia monta outro mapa a cada abertura: ele nasce no basemap que o
  // card mostra, não no Padrão.
  it("abre a tela cheia no basemap ativo do card", () => {
    const { result } = renderHook(() => usePanelMapCard(SOURCE));

    expect(result.current.fullscreenBinding.basemap).toBe("padrao");
    act(() => result.current.mapBinding.onBasemapChange("satelite"));

    expect(result.current.fullscreenBinding.basemap).toBe("satelite");
  });

  // O mapa do card fica montado atrás da tela cheia: a troca feita nela
  // chega ao card (botão, motor e crédito da imagem baixada).
  it("leva para o card o basemap trocado na tela cheia", () => {
    const { result } = renderHook(() => usePanelMapCard(SOURCE));

    act(() => result.current.fullscreenBinding.onBasemapChange("satelite"));

    expect(result.current.mapBinding.basemap).toBe("satelite");
    expect(result.current.imageSource).toBe(
      `${SOURCE} · Basemap: Esri, Maxar, Earthstar Geographics`,
    );
  });
});
