import { act, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  JOAO_PESSOA,
  MANIFEST_FIXTURE,
  PETROLINA,
  RECIFE,
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

// `renderPanelMap` usa a área "nordeste" quando o teste não diz outra.
const rasterOf = (year: number, area = "nordeste") => ({
  url: `/api/geodata/raster/aridez_${year}_${area}.png`,
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

  it("o raster é o recortado pela área do painel", async () => {
    const { engine } = await renderPanelMap({
      aridez: "base",
      ano: 2021,
      area: "semiarido",
    });

    expect(engine.setAridez).toHaveBeenLastCalledWith(
      rasterOf(2020, "semiarido"),
    );
  });

  it("trocar a área troca a imagem do raster", async () => {
    const { engine, rerender } = await renderPanelMap({
      aridez: "base",
      ano: 2021,
    });

    rerender({ area: "caatinga" });

    expect(engine.setAridez).toHaveBeenLastCalledWith(
      rasterOf(2020, "caatinga"),
    );
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

// % da área suscetível à desertificação por município, como o painel manda.
const ASD = new Map([
  [RECIFE.code, 10],
  [PETROLINA.code, 95],
]);

const aridezMap = {
  indicator: "aridez",
  ano: 2021,
  values: ASD,
  formatValue: (value: number) => `${value}%`,
  valueLabel: "Área suscetível",
  label: "Mapa do índice de aridez",
} as const;

const legendTexts = () =>
  within(screen.getByRole("list", { name: "Legenda do mapa" }))
    .getAllByRole("listitem")
    .map((item) => item.textContent);

describe("PanelMap do painel de aridez", () => {
  it("usa a malha municipal e o raster da década, sem preenchimento", async () => {
    const { engine } = await renderPanelMap(aridezMap);

    expect(fetch).toHaveBeenCalledWith(
      "/api/geodata/vector/municipios.geojson",
    );
    expect(engine.setAridez).toHaveBeenLastCalledWith(rasterOf(2020));
    expect(engine.setIndicatorPaint).toHaveBeenLastCalledWith({
      color: TRANSPARENT_FILL,
      outline: STYLES_FIXTURE.stateOutline,
      stateOutline: STYLES_FIXTURE.stateOutline,
      area: "nordeste",
    });
  });

  it("o tooltip mostra o valor do painel e o ranking por ele", async () => {
    const { engine } = await renderPanelMap(aridezMap);

    act(() => engine.emitHover({ props: RECIFE, x: 0, y: 0 }));

    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "Área suscetível: 10%",
    );
    expect(screen.getByRole("tooltip")).toHaveTextContent("2º de 2");
  });

  it("município sem valor do painel fica sem dado e fora do ranking", async () => {
    const { engine } = await renderPanelMap(aridezMap);

    act(() => engine.emitHover({ props: JOAO_PESSOA, x: 0, y: 0 }));

    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "Área suscetível: sem dado",
    );
    expect(screen.getByRole("tooltip")).not.toHaveTextContent("º de");
  });

  // O % do estado é do painel (razão das áreas), não a soma dos % municipais.
  it("no hover por estado mostra o % de ASD do estado vindo do painel", async () => {
    const stateValues = new Map([
      ["PE", 72.5],
      ["PB", 30],
    ]);
    const { engine } = await renderPanelMap({ ...aridezMap, stateValues });
    const pernambuco = { code: "PE", name: "PE", uf: "PE" };

    act(() =>
      engine.emitHover({ level: "estado", props: pernambuco, x: 0, y: 0 }),
    );

    expect(screen.getByRole("tooltip")).toHaveTextContent("Pernambuco (PE)");
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "Área suscetível: 72.5%",
    );
    expect(screen.getByRole("tooltip")).toHaveTextContent("1º de 2");
  });

  it("ranqueia só entre os municípios da área", async () => {
    const { engine } = await renderPanelMap({
      ...aridezMap,
      area: "semiarido",
    });

    act(() => engine.emitHover({ props: PETROLINA, x: 0, y: 0 }));

    expect(screen.getByRole("tooltip")).toHaveTextContent("1º de 1");
  });

  it("clique num município do estado escolhido escolhe o município", async () => {
    const { engine, props } = await renderPanelMap({
      ...aridezMap,
      recorte: { uf: ["PE"], mun: [] },
    });

    act(() => engine.emitClick(RECIFE));

    expect(props.onRecorteChange).toHaveBeenCalledWith({
      uf: ["PE"],
      mun: ["2611606"],
    });
  });

  it("município escolhido ganha véu nos vizinhos e contorno de seleção", async () => {
    const { engine, rerender } = await renderPanelMap(aridezMap);

    rerender({ recorte: { uf: ["PE"], mun: [RECIFE.code] } });

    expect(engine.setVeil.mock.lastCall?.[0].features).not.toBeNull();
    expect(engine.setSelection).toHaveBeenLastCalledWith([
      "in",
      ["get", "code"],
      ["literal", [RECIFE.code]],
    ]);
  });

  it("a legenda é a paleta da aridez com as contagens do painel", async () => {
    await renderPanelMap({ ...aridezMap, classCounts: new Map([[2, 1200]]) });

    expect(legendTexts()).toEqual(["Árido (1.200)", "Semiárido (0)"]);
  });

  it("sem contagens, a legenda mostra só as classes", async () => {
    await renderPanelMap(aridezMap);

    expect(legendTexts()).toEqual(["Árido", "Semiárido"]);
  });
});

describe("PanelMap tooltip com linhas de detalhe (aridez)", () => {
  const tooltipDetails = {
    feature: new Map([
      [
        PETROLINA.code,
        [
          "Percentual de área semiárida: 90,00%",
          "Percentual de área úmida: 10,00%",
        ],
      ],
    ]),
    state: new Map<string, string[]>(),
  };

  it("mostra as linhas de detalhe entre o nome e o valor", async () => {
    const { engine } = await renderPanelMap({ ...aridezMap, tooltipDetails });

    act(() => engine.emitHover({ props: PETROLINA, x: 0, y: 0 }));

    const lines = [...screen.getByRole("tooltip").querySelectorAll("p")];

    expect(lines.map((line) => line.textContent)).toEqual([
      "Petrolina (PE)",
      "Percentual de área semiárida: 90,00%",
      "Percentual de área úmida: 10,00%",
      "Área suscetível: 95%",
      "1º de 2",
    ]);
  });

  it("sem tooltipDetails, o tooltip segue só com nome, valor e posição", async () => {
    const { engine } = await renderPanelMap(aridezMap);

    act(() => engine.emitHover({ props: PETROLINA, x: 0, y: 0 }));

    expect(screen.getByRole("tooltip").querySelectorAll("p")).toHaveLength(3);
  });
});
