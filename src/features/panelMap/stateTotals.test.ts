import { describe, expect, it } from "vitest";

import type { MapFeatureProps } from "@/features/panelMap/geodataTypes";
import { featureValueReader } from "@/features/panelMap/mapTooltip";
import {
  describeState,
  rankStates,
  stateProps,
  stateTotalsInArea,
} from "@/features/panelMap/stateTotals";

const municipio = (
  code: string,
  uf: string,
  v2023: number | null,
  semiarido = 1,
): MapFeatureProps => ({ code, name: code, uf, nordeste: 1, semiarido, v2023 });

const READ_2023 = featureValueReader(2023);

describe("stateTotalsInArea", () => {
  it("soma os municípios de cada estado", () => {
    const totals = stateTotalsInArea(
      [
        municipio("1", "PE", 60),
        municipio("2", "PE", 9),
        municipio("3", "PB", 28),
      ],
      "nordeste",
      READ_2023,
    );

    expect([...totals]).toEqual([
      ["PE", 69],
      ["PB", 28],
    ]);
  });

  it("soma só os municípios da área de interesse", () => {
    const totals = stateTotalsInArea(
      [municipio("1", "PE", 60, 0), municipio("2", "PE", 9, 1)],
      "semiarido",
      READ_2023,
    );

    expect(totals.get("PE")).toBe(9);
  });

  it("ignora município sem número e deixa de fora estado sem nenhum", () => {
    const totals = stateTotalsInArea(
      [
        municipio("1", "PE", null),
        municipio("2", "PE", 9),
        municipio("3", "PB", null),
      ],
      "nordeste",
      READ_2023,
    );

    expect(totals.get("PE")).toBe(9);
    expect(totals.has("PB")).toBe(false);
  });

  it("um zero é número, não sem dado", () => {
    const totals = stateTotalsInArea(
      [municipio("1", "PB", 0)],
      "nordeste",
      READ_2023,
    );

    expect(totals.get("PB")).toBe(0);
  });
});

describe("rankStates", () => {
  it("ranqueia os estados pelo total, do maior ao menor", () => {
    const totals = new Map([
      ["PB", 28],
      ["PE", 69],
    ]);

    expect([...rankStates(totals)]).toEqual([
      ["PE", 1],
      ["PB", 2],
    ]);
  });
});

describe("stateProps", () => {
  const states = [{ code: "BA", name: "Bahia", uf: "BA" }];

  it("acha o estado pela sigla", () => {
    expect(stateProps(states, "BA").name).toBe("Bahia");
  });

  it("sem o estado no arquivo, usa a sigla como nome", () => {
    expect(stateProps(states, "PE")).toEqual({
      code: "PE",
      name: "PE",
      uf: "PE",
    });
  });
});

describe("describeState", () => {
  const format = {
    valueLabel: "PIB",
    formatValue: (value: number) => `R$ ${value}`,
  };
  const totals = new Map([
    ["PE", 69],
    ["BA", 90],
  ]);

  it("nomeia o estado com a sigla, mostra o total e a posição", () => {
    const bahia = { code: "BA", name: "Bahia", uf: "BA" };

    expect(describeState(bahia, totals, format)).toEqual({
      title: "Bahia (BA)",
      details: [],
      value: "PIB: R$ 90",
      rank: "1º de 2",
    });
  });

  it("estado sem número na área: sem dado e fora do ranking", () => {
    const paraiba = { code: "PB", name: "Paraíba", uf: "PB" };

    expect(describeState(paraiba, totals, format)).toEqual({
      title: "Paraíba (PB)",
      details: [],
      value: "PIB: sem dado",
      rank: null,
    });
  });
});
