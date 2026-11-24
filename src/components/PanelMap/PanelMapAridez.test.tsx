import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  MANIFEST_FIXTURE,
  STYLES_FIXTURE,
} from "@/components/PanelMap/panelMapFixtures";
import { renderPanelMap } from "@/components/PanelMap/renderPanelMap";
import {
  classColorExpression,
  TRANSPARENT_FILL,
} from "@/features/panelMap/qgisPaint";

afterEach(() => {
  vi.unstubAllGlobals();
});

const rasterOf = (year: number) => ({
  url: `/api/geodata/raster/aridez_${year}.png`,
  bounds: MANIFEST_FIXTURE.aridez.bounds,
});

describe("PanelMap aridez desligada (padrão)", () => {
  it("não tem controle de aridez nem raster", async () => {
    const { engine } = await renderPanelMap();

    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByText(/índice de aridez/i)).toBeNull();
    expect(engine.setAridez).toHaveBeenLastCalledWith(null);
    expect(engine.setAridez).not.toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.any(String) }),
    );
  });

  it("pinta as classes do indicador", async () => {
    const { engine } = await renderPanelMap({ aridez: "off" });

    expect(engine.setIndicatorPaint.mock.lastCall?.[0].color).toEqual(
      classColorExpression(STYLES_FIXTURE.indicators.pib.classes, 2023),
    );
  });
});

describe("PanelMap aridez como camada principal", () => {
  it("mostra o raster da década do ano, sem controle", async () => {
    const { engine } = await renderPanelMap({ aridez: "base", ano: 2021 });

    expect(engine.setAridez).toHaveBeenLastCalledWith(rasterOf(2020));
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("trocar o ano troca a década do raster", async () => {
    const { engine, rerender } = await renderPanelMap({
      aridez: "base",
      ano: 2021,
    });

    rerender({ ano: 2001 });

    expect(engine.setAridez).toHaveBeenLastCalledWith(rasterOf(2000));
  });

  it("ano antes da 1ª década fica sem raster", async () => {
    const { engine } = await renderPanelMap({ aridez: "base", ano: 1985 });

    expect(engine.setAridez).toHaveBeenLastCalledWith(null);
  });

  it("deixa o preenchimento transparente sobre o raster", async () => {
    const { engine } = await renderPanelMap({ aridez: "base" });

    expect(engine.setIndicatorPaint.mock.lastCall?.[0].color).toEqual(
      TRANSPARENT_FILL,
    );
  });
});
