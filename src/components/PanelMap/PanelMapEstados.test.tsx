import { act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PERNAMBUCO,
  STYLES_FIXTURE,
} from "@/components/PanelMap/panelMapFixtures";
import { renderPanelMap } from "@/components/PanelMap/renderPanelMap";
import { featurePaint } from "@/features/panelMap/qgisPaint";

const PE_BBOX = [
  [-41, -9.5],
  [-35, -3.5],
];

afterEach(() => {
  vi.unstubAllGlobals();
});

// Mapa com feições de estado: o do IDH, que só existe por estado.
const renderEstados = (overrides = {}) =>
  renderPanelMap({
    indicator: "idh",
    deepest: "estado",
    ano: 2024,
    area: "nordeste",
    ...overrides,
  });

describe("PanelMap com feições de estado (IDH)", () => {
  it("monta o motor com feições de estado", async () => {
    const { factory } = await renderEstados();

    expect(factory.options?.municipal).toBe(false);
  });

  it("pinta as classes do indicador, não uma malha sem valores", async () => {
    const { engine } = await renderEstados();

    expect(engine.setIndicatorPaint.mock.lastCall?.[0].color).toEqual(
      featurePaint(STYLES_FIXTURE, "idh", 2024, false).color,
    );
  });

  it("clique num estado escolhe o estado", async () => {
    const { engine, props } = await renderEstados();

    act(() => engine.emitClick(PERNAMBUCO));

    expect(props.onRecorteChange).toHaveBeenCalledWith({
      uf: ["PE"],
      mun: [],
    });
  });

  // Regressão: o município da barra prendia o recorte no nível município, e
  // o zoom em outro estado não mudava nada.
  it("o zoom troca o estado mesmo com município escolhido na barra", async () => {
    const { engine, props } = await renderEstados({
      recorte: { uf: ["PE"], mun: ["2611606"] },
    });

    act(() => engine.emitMoveEnd({ zoom: 7, centerUf: "PB" }));

    expect(props.onRecorteChange).toHaveBeenCalledWith({
      uf: ["PB"],
      mun: [],
    });
  });

  // Sem feição de município, o véu cobriria o próprio estado escolhido.
  it("município escolhido na barra vale pelo estado dele", async () => {
    const { engine } = await renderEstados({
      recorte: { uf: ["PE"], mun: ["2611606"] },
    });

    expect(engine.setVeil.mock.lastCall?.[0].features).toBeNull();
    expect(engine.setSelection).toHaveBeenLastCalledWith([
      "in",
      ["get", "code"],
      ["literal", ["PE"]],
    ]);
    expect(engine.fitTo).toHaveBeenLastCalledWith(PE_BBOX);
  });
});
