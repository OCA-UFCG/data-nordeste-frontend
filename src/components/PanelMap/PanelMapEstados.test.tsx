import { act, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { STYLES_FIXTURE } from "@/components/PanelMap/panelMapFixtures";
import { renderPanelMap } from "@/components/PanelMap/renderPanelMap";
import { stateMeshPaint } from "@/features/panelMap/featureLevel";
import type { MapFeatureProps } from "@/features/panelMap/geodataTypes";
import { NO_DATA_LABEL } from "@/features/panelMap/mapTooltip";

// A feição como vem do estados.geojson: sem valores nem marcas de área.
const PERNAMBUCO_MESH: MapFeatureProps = {
  code: "PE",
  name: "Pernambuco",
  uf: "PE",
};

const PE_BBOX = [
  [-41, -9.5],
  [-35, -3.5],
];

afterEach(() => {
  vi.unstubAllGlobals();
});

// Vista Estados do card de porte do perfil.
const renderEstados = (overrides = {}) =>
  renderPanelMap({
    indicator: "demografia",
    featureLevel: "estado",
    deepest: "estado",
    area: "semiarido",
    ...overrides,
  });

describe("PanelMap com featureLevel estado", () => {
  it("monta o motor com feições de estado", async () => {
    const { factory } = await renderEstados();

    expect(factory.options?.municipal).toBe(false);
  });

  it("as feições são os estados, marcados pelas áreas dos municípios", async () => {
    const { engine } = await renderEstados();
    const [sources] = engine.setSources.mock.lastCall ?? [];
    const props = sources?.features.features.map((state) => state.properties);

    expect(props).toEqual([
      expect.objectContaining({ code: "PE", nordeste: 1, semiarido: 1 }),
      expect.objectContaining({ code: "PB", nordeste: 1, semiarido: 0 }),
    ]);
  });

  it("pinta a malha de rosa e o estado escolhido mais forte", async () => {
    const { engine, rerender } = await renderEstados();

    expect(engine.setIndicatorPaint).toHaveBeenLastCalledWith({
      ...stateMeshPaint(STYLES_FIXTURE, []),
      stateOutline: STYLES_FIXTURE.stateOutline,
      area: "semiarido",
    });
    rerender({ recorte: { uf: ["PE"], mun: [] } });

    expect(engine.setIndicatorPaint.mock.lastCall?.[0].color).toEqual(
      stateMeshPaint(STYLES_FIXTURE, ["PE"]).color,
    );
  });

  it("não mostra a legenda de classes", async () => {
    await renderEstados();

    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.queryByRole("button", { name: /Sem dado/ })).toBeNull();
  });

  it("o tooltip mostra só o nome do estado", async () => {
    const { engine } = await renderEstados();

    act(() => engine.emitHover({ props: PERNAMBUCO_MESH, x: 0, y: 0 }));
    const tooltip = screen.getByRole("tooltip");

    expect(tooltip).toHaveTextContent(/^Pernambuco \(PE\)$/);
    expect(tooltip).not.toHaveTextContent(NO_DATA_LABEL);
  });

  it("clique num estado escolhe só o estado", async () => {
    const { engine, props } = await renderEstados();

    act(() => engine.emitClick(PERNAMBUCO_MESH));

    expect(props.onRecorteChange).toHaveBeenCalledWith({
      uf: ["PE"],
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
