import { describe, expect, it } from "vitest";
import {
  findPibRecord,
  getPibRanking,
  getPibSeries,
  getPibYearOverYear,
  getVabShares,
  parsePibPanel,
} from "./pibPanel";
import {
  formatCompactBrl,
  formatSignedPercent,
  formatWholeBrl,
} from "./pibFormat";

const EMPTY_VAB = {
  agropecuaria: null,
  industria: null,
  servicos: null,
  adm_publica: null,
};

const PAYLOAD = {
  fonte: "IBGE",
  unidade: "R$",
  anos: [2022, 2023],
  ufs: ["AL", "PB"],
  registros: [
    {
      uf: "PB",
      ano: 2023,
      pib_total: 90e9,
      pib_per_capita: 22_000,
      vab: EMPTY_VAB,
      impostos_liquidos: null,
    },
    {
      uf: "PB",
      ano: 2022,
      pib_total: 80e9,
      pib_per_capita: 20_000,
      vab: {
        agropecuaria: 5e9,
        industria: 15e9,
        servicos: 60e9,
        adm_publica: null,
      },
      impostos_liquidos: 8e9,
    },
    {
      uf: "AL",
      ano: 2023,
      pib_total: 100e9,
      pib_per_capita: null,
      vab: EMPTY_VAB,
      impostos_liquidos: null,
    },
  ],
};

describe("parsePibPanel", () => {
  it("maps the backend payload to the panel model", () => {
    const panel = parsePibPanel(PAYLOAD);

    expect(panel.source).toBe("IBGE");
    expect(panel.years).toEqual([2022, 2023]);
    expect(panel.records[0]).toMatchObject({ uf: "PB", pibTotal: 90e9 });
  });

  it("rejects a payload without registros, naming the expected shape", () => {
    expect(() => parsePibPanel({ fonte: "IBGE" })).toThrow(
      "expected { fonte, anos[], ufs[], registros[] }",
    );
  });
});

describe("PIB selectors", () => {
  const panel = parsePibPanel(PAYLOAD);

  it("orders one UF's series by year", () => {
    expect(getPibSeries(panel, "PB").map((point) => point.ano)).toEqual([
      2022, 2023,
    ]);
  });

  it("ranks UFs and drops those without the metric", () => {
    expect(getPibRanking(panel, 2023, "pibTotal")).toEqual([
      { uf: "AL", value: 100e9 },
      { uf: "PB", value: 90e9 },
    ]);
    expect(getPibRanking(panel, 2023, "pibPerCapita")).toEqual([
      { uf: "PB", value: 22_000 },
    ]);
  });

  it("computes VAB shares over the sectors that have data", () => {
    const shares = getVabShares(findPibRecord(panel, "PB", 2022)!);

    expect(shares.map((item) => item.label)).toEqual([
      "Serviços",
      "Indústria",
      "Agropecuária",
    ]);
    expect(shares[0].share).toBeCloseTo(0.75);
  });

  it("computes year-over-year change only when both years exist", () => {
    expect(getPibYearOverYear(panel, "PB", 2023)).toBeCloseTo(0.125);
    expect(getPibYearOverYear(panel, "AL", 2023)).toBeNull();
  });
});

describe("PIB formatting", () => {
  it("formats money and change in pt-BR", () => {
    expect(formatCompactBrl(80e9)).toMatch(/^R\$\s80\sbi$/);
    expect(formatWholeBrl(20_000)).toMatch(/^R\$\s20\.000$/);
    expect(formatSignedPercent(0.125)).toBe("+12,5%");
    expect(formatCompactBrl(null)).toBe("—");
  });
});
