import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PanelMap, type PanelMapProps } from "@/components/PanelMap/PanelMap";
import { PanelMapEngineFactoryFake } from "@/components/PanelMap/panelMapEngineFake";
import {
  GeodataFetchFake,
  JOAO_PESSOA,
  MANIFEST_FIXTURE,
  PERNAMBUCO,
  PETROLINA,
  RECIFE,
  STYLES_FIXTURE,
} from "@/components/PanelMap/panelMapFixtures";
import { EMPTY_RECORTE, type MapRecorte } from "@/features/panelMap/mapRecorte";
import { classColorExpression } from "@/features/panelMap/qgisPaint";

const PE: MapRecorte = { uf: ["PE"], mun: [] };
const NORDESTE_BBOX = [
  [-48, -18],
  [-35, -5],
];
const PE_BBOX = [
  [-41, -9.5],
  [-35, -3.5],
];
const UNAVAILABLE =
  "Mapa indisponível: os geodados não foram encontrados neste ambiente.";

afterEach(() => {
  vi.unstubAllGlobals();
});

function panelMapProps(
  factory: PanelMapEngineFactoryFake,
  overrides: Partial<PanelMapProps>,
): PanelMapProps {
  return {
    indicator: "pib",
    ano: 2023,
    area: "nordeste",
    recorte: EMPTY_RECORTE,
    deepest: "municipio",
    onRecorteChange: vi.fn<(recorte: MapRecorte) => void>(),
    formatValue: (value) => `R$ ${value}`,
    label: "Mapa do PIB por município",
    createEngine: factory.create,
    ...overrides,
  };
}

async function renderPanelMap(overrides: Partial<PanelMapProps> = {}) {
  vi.stubGlobal("fetch", new GeodataFetchFake().fetch);
  const factory = new PanelMapEngineFactoryFake();
  let props = panelMapProps(factory, overrides);
  const view = render(<PanelMap {...props} />);
  const rerender = (next: Partial<PanelMapProps>) => {
    props = { ...props, ...next };
    view.rerender(<PanelMap {...props} />);
  };

  // Pronto = o motor já recebeu as fontes (todos os efeitos do motor rodaram).
  await waitFor(() => expect(factory.engine.setSources).toHaveBeenCalled());

  return { factory, engine: factory.engine, props, view, rerender };
}

describe("PanelMap controles", () => {
  it("começa no basemap Oceano", async () => {
    const { factory } = await renderPanelMap();

    expect(screen.getByRole("button", { name: "Oceano" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Satélite" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(factory.options).toMatchObject({
      basemap: "oceano",
      municipal: true,
    });
  });

  it("clicar em Satélite troca o basemap do motor", async () => {
    const { engine } = await renderPanelMap();

    await userEvent.click(screen.getByRole("button", { name: "Satélite" }));

    expect(engine.setBasemap).toHaveBeenLastCalledWith("satelite");
    expect(screen.getByRole("button", { name: "Satélite" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("ligar a aridez mostra o raster da última década", async () => {
    const { engine } = await renderPanelMap();

    expect(engine.setAridez).toHaveBeenLastCalledWith(null);
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Índice de aridez" }),
    );

    expect(engine.setAridez).toHaveBeenLastCalledWith({
      url: "/api/geodata/raster/aridez_2020.png",
      bounds: MANIFEST_FIXTURE.aridez.bounds,
    });
  });

  it("a década escolhida troca o raster", async () => {
    const { engine } = await renderPanelMap();

    await userEvent.click(
      screen.getByRole("checkbox", { name: "Índice de aridez" }),
    );
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Década do índice de aridez" }),
      "1990",
    );

    expect(engine.setAridez).toHaveBeenLastCalledWith({
      url: "/api/geodata/raster/aridez_1990.png",
      bounds: MANIFEST_FIXTURE.aridez.bounds,
    });
  });

  it("com aridez ligada, o preenchimento fica transparente e a legenda ganha a paleta (regra 5)", async () => {
    const { engine } = await renderPanelMap();
    const checkbox = screen.getByRole("checkbox", { name: "Índice de aridez" });

    await userEvent.click(checkbox);

    expect(engine.setIndicatorPaint.mock.lastCall?.[0].color).toEqual([
      "to-color",
      "rgba(0,0,0,0)",
    ]);
    expect(screen.getByText("Árido")).toBeInTheDocument();

    await userEvent.click(checkbox);

    expect(engine.setIndicatorPaint.mock.lastCall?.[0].color).toEqual(
      classColorExpression(STYLES_FIXTURE.indicators.pib.classes, 2023),
    );
    expect(screen.queryByText("Árido")).toBeNull();
  });

  it("a legenda mostra as classes do qgz do indicador", async () => {
    await renderPanelMap();

    expect(screen.getByText("≤ R$ 500 Mi")).toBeInTheDocument();
    expect(screen.getByText("> R$ 500 Mi")).toBeInTheDocument();
  });
});

describe("PanelMap pintura e enquadramento", () => {
  it("entrega as fontes e enquadra a área ao montar", async () => {
    const { engine } = await renderPanelMap();

    expect(engine.setSources).toHaveBeenCalledTimes(1);
    expect(engine.fitTo).toHaveBeenCalledWith(NORDESTE_BBOX);
    expect(engine.setVeil).toHaveBeenLastCalledWith({
      states: null,
      features: null,
    });
  });

  it("pinta as classes do ano e repinta quando o ano muda", async () => {
    const { engine, rerender } = await renderPanelMap();

    expect(engine.setIndicatorPaint).toHaveBeenLastCalledWith({
      color: classColorExpression(STYLES_FIXTURE.indicators.pib.classes, 2023),
      outline: STYLES_FIXTURE.indicators.pib.outline,
      stateOutline: STYLES_FIXTURE.stateOutline,
      area: "nordeste",
    });
    rerender({ ano: 2022 });

    expect(engine.setIndicatorPaint.mock.lastCall?.[0].color).toEqual(
      classColorExpression(STYLES_FIXTURE.indicators.pib.classes, 2022),
    );
  });

  it("recorte novo por props enquadra e aplica véu e seleção", async () => {
    const { engine, rerender } = await renderPanelMap();

    engine.fitTo.mockClear();
    engine.setVeil.mockClear();
    rerender({ recorte: PE });

    expect(engine.fitTo).toHaveBeenCalledWith(PE_BBOX);
    expect(engine.setVeil).toHaveBeenCalledTimes(1);
    expect(engine.setSelection).toHaveBeenLastCalledWith([
      "in",
      ["get", "code"],
      ["literal", ["PE"]],
    ]);
  });

  it("recorte com a mesma seleção em outro objeto não enquadra de novo", async () => {
    const { engine, rerender } = await renderPanelMap({ recorte: PE });

    engine.fitTo.mockClear();
    rerender({ recorte: { uf: ["PE"], mun: [] } });

    expect(engine.fitTo).not.toHaveBeenCalled();
  });

  it("trocar a área enquadra a área nova", async () => {
    const { engine, rerender } = await renderPanelMap();

    engine.fitTo.mockClear();
    rerender({ area: "semiarido" });

    expect(engine.fitTo).toHaveBeenCalledWith([
      [-45, -16],
      [-36, -7],
    ]);
  });
});

describe("PanelMap recorte pelo zoom (regras 3 e 4)", () => {
  it("o recorte que o próprio zoom escolheu não enquadra, só pinta o véu", async () => {
    const { engine, props, rerender } = await renderPanelMap();

    act(() => engine.emitMoveEnd({ zoom: 7, centerUf: "PE" }));
    expect(props.onRecorteChange).toHaveBeenCalledWith(PE);
    engine.fitTo.mockClear();
    engine.setVeil.mockClear();
    engine.setSelection.mockClear();
    rerender({ recorte: PE });

    expect(engine.fitTo).not.toHaveBeenCalled();
    expect(engine.setVeil).toHaveBeenCalledTimes(1);
    expect(engine.setSelection).toHaveBeenCalledTimes(1);
  });

  it("limpar e escolher de novo o mesmo recorte pela barra enquadra", async () => {
    const { engine, rerender } = await renderPanelMap();

    act(() => engine.emitMoveEnd({ zoom: 7, centerUf: "PE" }));
    rerender({ recorte: PE });
    rerender({ recorte: EMPTY_RECORTE });
    engine.fitTo.mockClear();
    rerender({ recorte: PE });

    expect(engine.fitTo).toHaveBeenCalledWith(PE_BBOX);
  });

  it("clique num município escolhe o município", async () => {
    const { engine, props } = await renderPanelMap();

    act(() => engine.emitClick(RECIFE));

    expect(props.onRecorteChange).toHaveBeenCalledWith({
      uf: ["PE"],
      mun: ["2611606"],
    });
  });

  it("clique num município sem nível município escolhe o estado", async () => {
    const { engine, props } = await renderPanelMap({ deepest: "estado" });

    act(() => engine.emitClick(JOAO_PESSOA));

    expect(props.onRecorteChange).toHaveBeenCalledWith({
      uf: ["PB"],
      mun: [],
    });
  });

  it("clique num estado do IDH escolhe o estado", async () => {
    const { engine, props, factory } = await renderPanelMap({
      indicator: "idh",
      deepest: "estado",
      ano: 2024,
    });

    act(() => engine.emitClick(PERNAMBUCO));

    expect(factory.options?.municipal).toBe(false);
    expect(props.onRecorteChange).toHaveBeenCalledWith(PE);
  });

  it("clique no que já está escolhido só enquadra", async () => {
    const { engine, props } = await renderPanelMap({
      indicator: "idh",
      deepest: "estado",
      recorte: PE,
    });

    engine.fitTo.mockClear();
    act(() => engine.emitClick(PERNAMBUCO));

    expect(props.onRecorteChange).not.toHaveBeenCalled();
    expect(engine.fitTo).toHaveBeenCalledWith(PE_BBOX);
  });
});

describe("PanelMap tooltip", () => {
  it("mostra nome, valor e posição no ranking da área", async () => {
    const { engine } = await renderPanelMap();

    act(() => engine.emitHover({ props: JOAO_PESSOA, x: 40, y: 30 }));

    const tooltip = screen.getByRole("tooltip");

    expect(tooltip).toHaveTextContent("João Pessoa (PB)");
    expect(tooltip).toHaveTextContent("R$ 28442131000");
    expect(tooltip).toHaveTextContent("2º de 3 no ranking");
    expect(tooltip).toHaveStyle({ left: "52px", top: "42px" });
  });

  it("ranqueia só entre as feições da área", async () => {
    const { engine } = await renderPanelMap({ area: "semiarido" });

    act(() => engine.emitHover({ props: PETROLINA, x: 0, y: 0 }));

    expect(screen.getByRole("tooltip")).toHaveTextContent("1º de 1 no ranking");
  });

  it("some quando o ponteiro sai das feições", async () => {
    const { engine } = await renderPanelMap();

    act(() => engine.emitHover({ props: RECIFE, x: 0, y: 0 }));
    act(() => engine.emitHover(null));

    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});

describe("PanelMap ciclo de vida", () => {
  it("avisa quando os geodados não existem, sem criar o mapa", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", new GeodataFetchFake(true).fetch);
    const factory = new PanelMapEngineFactoryFake();

    render(<PanelMap {...panelMapProps(factory, {})} />);

    expect(await screen.findByText(UNAVAILABLE)).toBeInTheDocument();
    expect(factory.create).not.toHaveBeenCalled();
  });

  it("entrega o motor ao card e o desmonta ao sair", async () => {
    const onEngine = vi.fn();
    const { engine, factory, view } = await renderPanelMap({ onEngine });

    expect(onEngine).toHaveBeenLastCalledWith(engine);
    view.unmount();

    expect(factory.teardown).toHaveBeenCalledTimes(1);
    expect(onEngine).toHaveBeenLastCalledWith(null);
  });

  it("re-renderizar com callbacks novos não recria o mapa", async () => {
    const { factory, rerender } = await renderPanelMap();

    rerender({ onRecorteChange: vi.fn(), onEngine: vi.fn() });

    expect(factory.create).toHaveBeenCalledTimes(1);
  });
});
