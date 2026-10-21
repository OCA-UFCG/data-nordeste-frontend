import { describe, expect, it } from "vitest";
import {
  findPibPoint,
  getActivitiesOfYear,
  getLatestPibYear,
  getSelectionLabel,
  getVabShares,
  parsePibPanel,
  resolveBreakdownYear,
} from "./pibPanel";
import {
  formatCompactBrl,
  formatPercent,
  formatSignedPercent,
  formatWholeBrl,
} from "./pibFormat";
import { PIB_PANEL_PAYLOAD } from "./pibPanelFixtures";

describe("parsePibPanel", () => {
  it("maps the backend payload to the panel model", () => {
    const panel = parsePibPanel(PIB_PANEL_PAYLOAD);

    expect(panel.selection).toEqual({ area: "ne", uf: "PB", municipio: null });
    expect(panel.options.municipalities).toEqual([
      { code: 2504009, name: "Campina Grande" },
    ]);
    expect(panel.vab[1].sectors.servicos).toBe(6e9);
    expect(panel.activities[0]).toMatchObject({
      municipalities: 8,
      pibShare: 0.5,
    });
  });

  it("rejects a payload without serie, naming the expected shape", () => {
    expect(() => parsePibPanel({ fonte: "IBGE" })).toThrow(
      "expected { fonte, recorte, opcoes, serie[], vab[], atividades[] }",
    );
  });
});

describe("PIB selectors", () => {
  const panel = parsePibPanel(PIB_PANEL_PAYLOAD);

  it("finds the latest year and one year's point", () => {
    expect(getLatestPibYear(panel)).toBe(2023);
    expect(findPibPoint(panel, 2022)?.pibTotal).toBe(80e9);
  });

  it("falls back to the latest earlier year for VAB and activities", () => {
    expect(resolveBreakdownYear([2020, 2021], 2023)).toBe(2021);
    expect(resolveBreakdownYear([2020, 2021], 2020)).toBe(2020);
    expect(resolveBreakdownYear([2021], 2019)).toBeNull();
  });

  it("computes VAB shares over the sectors that have data", () => {
    const shares = getVabShares(panel.vab[1]);

    expect(shares[0]).toMatchObject({ label: "Serviços", share: 0.6 });
  });

  it("orders a year's activities by number of municipalities", () => {
    expect(
      getActivitiesOfYear(panel, 2021).map((item) => item.municipalities),
    ).toEqual([208, 8]);
  });

  it("names the selection by municipality, then state, then area", () => {
    expect(getSelectionLabel(panel)).toBe("PB");
    expect(
      getSelectionLabel({
        ...panel,
        selection: { area: "ne", uf: null, municipio: null },
      }),
    ).toBe("Nordeste");
    expect(
      getSelectionLabel({
        ...panel,
        selection: { area: "ne", uf: "PB", municipio: 2504009 },
      }),
    ).toBe("Campina Grande (PB)");
  });
});

describe("PIB formatting", () => {
  it("formats money and shares in pt-BR", () => {
    expect(formatCompactBrl(80e9)).toMatch(/^R\$\s80\sbi$/);
    expect(formatWholeBrl(20_000)).toMatch(/^R\$\s20\.000$/);
    expect(formatSignedPercent(0.125)).toBe("+12,5%");
    expect(formatPercent(0.461)).toBe("46,1%");
    expect(formatCompactBrl(null)).toBe("—");
  });
});
