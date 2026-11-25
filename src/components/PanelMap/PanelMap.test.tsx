import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ENGINE_UNAVAILABLE, PanelMap } from "@/components/PanelMap/PanelMap";
import { PanelMapEngineFactoryFake } from "@/components/PanelMap/panelMapEngineFake";
import {
  AREA_STATES_FIXTURES,
  GeodataFetchFake,
  JOAO_PESSOA,
  PERNAMBUCO,
  PETROLINA,
  RECIFE,
  STYLES_FIXTURE,
} from "@/components/PanelMap/panelMapFixtures";
import {
  panelMapProps,
  renderPanelMap,
} from "@/components/PanelMap/renderPanelMap";
import { EMPTY_RECORTE, type MapRecorte } from "@/features/panelMap/mapRecorte";
import { classColorExpression } from "@/features/panelMap/qgisPaint";

const PE: MapRecorte = { uf: ["PE"], mun: [] };

// Como o motor entrega o estado no hover por estado: só a sigla.
const STATE_PE = { code: "PE", name: "PE", uf: "PE" };
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

describe("PanelMap controles", () => {
  it("começa no basemap Padrão", async () => {
    const { factory } = await renderPanelMap();

    expect(screen.getByRole("button", { name: "Padrão" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Satélite" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(factory.options).toMatchObject({
      basemap: "padrao",
      municipal: true,
      cooperative: false,
    });
  });

  // A tela cheia nasce no basemap do card: o motor já é criado nele (sem
  // piscar o Padrão) e o botão ativo é o dele.
  it("começa no basemap inicial pedido", async () => {
    const { factory } = await renderPanelMap({ initialBasemap: "satelite" });

    expect(screen.getByRole("button", { name: "Satélite" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(factory.options?.basemap).toBe("satelite");
  });

  // O maplibre-gl.css força `position: relative` no contêiner; sem tamanho
  // explícito ele fica com altura 0 (o jsdom não tem cascata de CSS: guarda a classe).
  it("dá ao contêiner do motor altura e largura explícitas", async () => {
    const { factory } = await renderPanelMap();

    const container = factory.create.mock.calls[0][0];
    expect(container).toHaveClass("h-full", "w-full");
  });

  // No card, Ctrl/⌘ + roda e dois dedos; a tela cheia fica com o padrão.
  it("pede gestos cooperativos ao motor quando o card pede", async () => {
    const { factory } = await renderPanelMap({ cooperative: true });

    expect(factory.options?.cooperative).toBe(true);
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

  it("avisa o card do basemap escolhido (crédito da imagem)", async () => {
    const onBasemapChange = vi.fn();
    await renderPanelMap({ onBasemapChange });

    await userEvent.click(screen.getByRole("button", { name: "Satélite" }));

    expect(onBasemapChange).toHaveBeenLastCalledWith("satelite");
  });
});

describe("PanelMap legenda", () => {
  it("mostra as classes do qgz com a contagem de feições da área no ano", async () => {
    await renderPanelMap();
    const legend = screen.getByRole("list", { name: "Legenda do mapa" });

    expect(
      within(legend)
        .getAllByRole("listitem")
        .map((i) => i.textContent),
    ).toEqual(["≤ R$ 500 Mi (0)", "> R$ 500 Mi (3)"]);
  });

  it("fica abaixo do quadro do mapa, fora dele", async () => {
    await renderPanelMap();
    const frame = screen.getByRole("region");
    const legend = screen.getByRole("list", { name: "Legenda do mapa" });

    expect(frame).not.toContainElement(legend);
    expect(frame.nextElementSibling).toContainElement(legend);
    expect(screen.queryByText("Mapa do PIB por município")).toBeNull();
  });

  it("a altura vai para o quadro do mapa, não para a legenda", async () => {
    await renderPanelMap({ className: "h-[480px]" });

    expect(screen.getByRole("region")).toHaveClass("h-[480px]");
  });

  it("conta só as feições da área escolhida", async () => {
    await renderPanelMap({ area: "semiarido" });

    expect(screen.getByText("> R$ 500 Mi (1)")).toBeInTheDocument();
  });

  it("o ano sem valores mostra Sem dado; com valores, não mostra", async () => {
    const { rerender } = await renderPanelMap();

    expect(screen.queryByText(/Sem dado/)).toBeNull();
    rerender({ ano: 2022 });

    expect(screen.getByText("Sem dado (3)")).toBeInTheDocument();
  });

  it("formata a contagem em pt-BR", async () => {
    const { rerender } = await renderPanelMap({
      indicator: "idh",
      deepest: "estado",
      ano: 2024,
    });

    expect(screen.getByText("Até 0,7 (1)")).toBeInTheDocument();
    expect(screen.getByText("> 0,7 (1)")).toBeInTheDocument();
    rerender({ ano: 2023 });

    expect(screen.getByText("Sem dado (2)")).toBeInTheDocument();
  });
});

describe("PanelMap pintura e enquadramento", () => {
  it("entrega as fontes e enquadra a área ao montar", async () => {
    const { engine } = await renderPanelMap();

    expect(engine.setSources).toHaveBeenCalledTimes(1);
    expect(engine.fitTo).toHaveBeenCalledWith(NORDESTE_BBOX);
    expect(engine.setVeil).toHaveBeenLastCalledWith({
      states: null,
      selectedStates: null,
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

  // Pedido do usuário (25/11/2026): com o estado selecionado, a divisa dos
  // municípios dele aparece já no zoom do enquadramento do estado.
  it("com estado selecionado mostra os limites municipais dele", async () => {
    const { engine, rerender } = await renderPanelMap();

    expect(engine.setStateMunicipalLines).toHaveBeenLastCalledWith(null);
    rerender({ recorte: PE });

    expect(engine.setStateMunicipalLines).toHaveBeenLastCalledWith([
      "all",
      ["==", ["get", "nordeste"], 1],
      ["in", ["get", "uf"], ["literal", ["PE"]]],
    ]);
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
  it("o recorte que o próprio zoom escolheu enquadra e pinta o véu", async () => {
    const { engine, props, rerender } = await renderPanelMap();

    act(() => engine.emitMoveEnd({ zoom: 7, centerUf: "PE" }));
    expect(props.onRecorteChange).toHaveBeenCalledWith(PE);
    engine.fitTo.mockClear();
    engine.setVeil.mockClear();
    engine.setSelection.mockClear();
    rerender({ recorte: PE });

    expect(engine.fitTo).toHaveBeenCalledTimes(1);
    expect(engine.fitTo).toHaveBeenCalledWith(PE_BBOX);
    expect(engine.setVeil).toHaveBeenCalledTimes(1);
    expect(engine.setSelection).toHaveBeenCalledTimes(1);
  });

  it("o enquadramento do zoom não gera filtro e o zoom-out abaixo da âncora limpa", async () => {
    const { engine, props, rerender } = await renderPanelMap();

    act(() => engine.emitMoveEnd({ zoom: 7, centerUf: "PE" }));
    rerender({ recorte: PE });

    // Fim do fit programático: âncora no zoom em que o enquadramento terminou.
    act(() =>
      engine.emitMoveEnd({
        zoom: 6.8,
        centerUf: "PE",
        fit: true,
        fittedZoom: 6.8,
      }),
    );

    expect(props.onRecorteChange).toHaveBeenCalledTimes(1);

    act(() =>
      engine.emitMoveEnd({ zoom: 6.2, centerUf: "PE", fittedZoom: 6.8 }),
    );

    expect(props.onRecorteChange).toHaveBeenCalledTimes(2);
    expect(props.onRecorteChange).toHaveBeenLastCalledWith(EMPTY_RECORTE);
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

  it("clique num município na área escolhe o estado dele", async () => {
    const { engine, props } = await renderPanelMap();

    act(() => engine.emitClick(RECIFE));

    expect(props.onRecorteChange).toHaveBeenCalledWith(PE);
  });

  it("clique num município do estado escolhido escolhe o município", async () => {
    const { engine, props } = await renderPanelMap({ recorte: PE });

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

  it("clique no estado já escolhido volta à área de interesse", async () => {
    const { engine, props } = await renderPanelMap({
      indicator: "idh",
      deepest: "estado",
      recorte: PE,
    });

    act(() => engine.emitClick(PERNAMBUCO));

    expect(props.onRecorteChange).toHaveBeenCalledWith(EMPTY_RECORTE);
  });

  it("clique fora do estado escolhido volta à área de interesse", async () => {
    const { engine, props } = await renderPanelMap({ recorte: PE });

    act(() => engine.emitClick(JOAO_PESSOA));

    expect(props.onRecorteChange).toHaveBeenCalledWith(EMPTY_RECORTE);
  });

  it("clique no vazio com estado escolhido volta à área de interesse", async () => {
    const { engine, props } = await renderPanelMap({ recorte: PE });

    act(() => engine.emitClick(null));

    expect(props.onRecorteChange).toHaveBeenCalledWith(EMPTY_RECORTE);
  });

  it("clique no vazio na área inteira não emite nada", async () => {
    const { engine, props } = await renderPanelMap();

    act(() => engine.emitClick(null));

    expect(props.onRecorteChange).not.toHaveBeenCalled();
  });

  it("clique em outro município com município escolhido o escolhe", async () => {
    const { engine, props } = await renderPanelMap({
      recorte: { uf: ["PE"], mun: ["2611606"] },
    });

    act(() => engine.emitClick(JOAO_PESSOA));

    expect(props.onRecorteChange).toHaveBeenCalledWith({
      uf: ["PB"],
      mun: ["2507507"],
    });
  });

  it("clique no vazio com município escolhido não emite nada", async () => {
    const { engine, props } = await renderPanelMap({
      recorte: { uf: ["PE"], mun: ["2611606"] },
    });

    act(() => engine.emitClick(null));

    expect(props.onRecorteChange).not.toHaveBeenCalled();
  });

  it("clique no município já escolhido volta ao estado", async () => {
    const { engine, props } = await renderPanelMap({
      recorte: { uf: ["PE"], mun: ["2611606"] },
    });

    act(() => engine.emitClick(RECIFE));

    expect(props.onRecorteChange).toHaveBeenCalledWith(PE);
  });
});

describe("PanelMap tooltip", () => {
  it("mostra nome, valor e posição no ranking da área", async () => {
    const { engine } = await renderPanelMap();

    act(() => engine.emitHover({ props: JOAO_PESSOA, x: 40, y: 30 }));

    const tooltip = screen.getByRole("tooltip");

    expect(tooltip).toHaveTextContent("João Pessoa (PB)");
    expect(tooltip).toHaveTextContent("PIB: R$ 28442131000");
    expect(tooltip).toHaveTextContent("2º de 3");
    expect(tooltip).not.toHaveTextContent("ranking");
    expect(tooltip).toHaveStyle({ left: "52px", top: "42px" });
  });

  it("ranqueia só entre as feições da área", async () => {
    const { engine } = await renderPanelMap({ area: "semiarido" });

    act(() => engine.emitHover({ props: PETROLINA, x: 0, y: 0 }));

    expect(screen.getByRole("tooltip")).toHaveTextContent("1º de 1");
  });

  it("some quando o ponteiro sai das feições", async () => {
    const { engine } = await renderPanelMap();

    act(() => engine.emitHover({ props: RECIFE, x: 0, y: 0 }));
    act(() => engine.emitHover(null));

    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});

describe("PanelMap hover por estado (só a área de interesse)", () => {
  it("só com a área, o hover nomeia estados; com estado escolhido, municípios", async () => {
    const { engine, rerender } = await renderPanelMap();

    expect(engine.setHoverLevel).toHaveBeenLastCalledWith("estado");

    rerender({ recorte: PE });

    await waitFor(() =>
      expect(engine.setHoverLevel).toHaveBeenLastCalledWith("feicao"),
    );
  });

  it("no IDH (feições de estado) o hover é sempre a própria feição", async () => {
    const { engine } = await renderPanelMap({ indicator: "idh", ano: 2024 });

    expect(engine.setHoverLevel).toHaveBeenLastCalledWith("feicao");
  });

  it("mostra o estado, a soma dos municípios dele na área e a posição", async () => {
    const { engine } = await renderPanelMap();

    act(() =>
      engine.emitHover({ level: "estado", props: STATE_PE, x: 0, y: 0 }),
    );

    const tooltip = screen.getByRole("tooltip");

    expect(tooltip).toHaveTextContent("Pernambuco (PE)");
    expect(tooltip).toHaveTextContent("PIB: R$ 69000000000");
    expect(tooltip).toHaveTextContent("1º de 2");
  });

  it("soma só os municípios da área de interesse", async () => {
    const { engine } = await renderPanelMap({ area: "semiarido" });

    act(() =>
      engine.emitHover({ level: "estado", props: STATE_PE, x: 0, y: 0 }),
    );

    expect(screen.getByRole("tooltip")).toHaveTextContent("PIB: R$ 9000000000");
    expect(screen.getByRole("tooltip")).toHaveTextContent("1º de 1");
  });

  it("com estado escolhido, o hover do município segue como antes", async () => {
    const { engine } = await renderPanelMap({ recorte: PE });

    act(() => engine.emitHover({ level: "feicao", props: RECIFE, x: 0, y: 0 }));

    expect(screen.getByRole("tooltip")).toHaveTextContent("Recife (PE)");
    expect(screen.getByRole("tooltip")).toHaveTextContent("1º de 3");
  });
});

describe("PanelMap estado recortado pela área de interesse", () => {
  it("entrega ao motor as partes de dentro e de fora da área e troca com a área", async () => {
    const { engine, rerender } = await renderPanelMap();

    expect(engine.setAreaStates).toHaveBeenLastCalledWith(
      AREA_STATES_FIXTURES.nordeste,
    );
    rerender({ area: "semiarido" });

    await waitFor(() =>
      expect(engine.setAreaStates).toHaveBeenLastCalledWith(
        AREA_STATES_FIXTURES.semiarido,
      ),
    );
  });

  // Montar com estado escolhido enquadra uma vez só: espera o corte chegar.
  it("com estado escolhido, enquadra uma vez só a parte dele dentro da área", async () => {
    const { engine } = await renderPanelMap({ area: "semiarido", recorte: PE });

    expect(engine.fitTo).toHaveBeenCalledTimes(1);
    expect(engine.fitTo).toHaveBeenLastCalledWith([
      [-40.5, -9.4],
      [-39.5, -8.4],
    ]);
  });

  it("trocar a área com estado escolhido enquadra uma vez o corte da nova área", async () => {
    const { engine, rerender } = await renderPanelMap({ recorte: PE });

    engine.fitTo.mockClear();
    rerender({ area: "semiarido" });

    await waitFor(() => expect(engine.fitTo).toHaveBeenCalledTimes(1));
    expect(engine.fitTo).toHaveBeenLastCalledWith([
      [-40.5, -9.4],
      [-39.5, -8.4],
    ]);
  });

  it("na área inteira, a chegada dos estados da área não reenquadra", async () => {
    const { engine } = await renderPanelMap({ area: "semiarido" });

    expect(engine.fitTo).toHaveBeenCalledTimes(1);
  });

  it("o véu da parte de fora da área casa o estado escolhido", async () => {
    const { engine } = await renderPanelMap({ recorte: PE });

    expect(engine.setVeil.mock.lastCall?.[0].selectedStates).toEqual([
      "in",
      ["get", "code"],
      ["literal", ["PE"]],
    ]);
  });

  it("sem o arquivo da área, usa os estados inteiros, sem véu de fora, e registra a falha", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const missing = ["/api/geodata/vector/estados_semiarido.geojson"];
    vi.stubGlobal("fetch", new GeodataFetchFake(false, missing).fetch);
    const factory = new PanelMapEngineFactoryFake();

    render(<PanelMap {...panelMapProps(factory, { area: "semiarido" })} />);

    await waitFor(() => expect(error).toHaveBeenCalled());
    expect(String(error.mock.lastCall?.[0])).toContain(
      "panel_map_area_states_failed",
    );
    const states = factory.engine.setAreaStates.mock.lastCall?.[0];

    expect(states?.inside.features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          properties: expect.objectContaining({ uf: "PE" }),
        }),
      ]),
    );
    expect(states?.outside.features).toEqual([]);
  });
});

// Regressão: GEODATA_DIR sem os arquivos recortados (gamma antes do rsync)
// derrubava o mapa com "collection.features is undefined".
describe("PanelMap sem os estados recortados", () => {
  const MISSING = [
    "/api/geodata/vector/estados_nordeste.geojson",
    "/api/geodata/vector/estados_fora_nordeste.geojson",
  ];

  async function renderWithoutAreaStates(recorte: MapRecorte) {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", new GeodataFetchFake(false, MISSING).fetch);
    const factory = new PanelMapEngineFactoryFake();

    render(<PanelMap {...panelMapProps(factory, { recorte })} />);
    await waitFor(() => expect(factory.engine.fitTo).toHaveBeenCalled());

    return factory.engine;
  }

  it("desenha o mapa com os estados inteiros e o véu de fora vazio", async () => {
    const engine = await renderWithoutAreaStates(EMPTY_RECORTE);
    const states = engine.setAreaStates.mock.lastCall?.[0];

    expect(screen.getByRole("region")).toBeInTheDocument();
    expect(states?.inside.features.map((f) => f.properties?.code)).toEqual([
      "PE",
      "PB",
    ]);
    expect(states?.outside).toEqual({
      type: "FeatureCollection",
      features: [],
    });
  });

  it("com estado escolhido, seleciona e enquadra o estado inteiro", async () => {
    const engine = await renderWithoutAreaStates(PE);

    expect(engine.fitTo).toHaveBeenCalledTimes(1);
    expect(engine.fitTo).toHaveBeenLastCalledWith(PE_BBOX);
    expect(engine.setSelection).toHaveBeenLastCalledWith([
      "in",
      ["get", "code"],
      ["literal", ["PE"]],
    ]);
  });

  it("o hover por estado segue nomeando o estado", async () => {
    const engine = await renderWithoutAreaStates(EMPTY_RECORTE);

    act(() =>
      engine.emitHover({ level: "estado", props: STATE_PE, x: 0, y: 0 }),
    );

    expect(screen.getByRole("tooltip")).toHaveTextContent("Pernambuco (PE)");
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

  it("avisa quando o motor não consegue criar o mapa (sem WebGL)", async () => {
    vi.stubGlobal("fetch", new GeodataFetchFake().fetch);
    const factory = new PanelMapEngineFactoryFake(new Error("no WebGL"));

    render(<PanelMap {...panelMapProps(factory, {})} />);

    expect(await screen.findByText(ENGINE_UNAVAILABLE)).toBeInTheDocument();
    expect(screen.queryByRole("region")).toBeNull();
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
