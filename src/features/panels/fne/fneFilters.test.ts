import { describe, expect, it } from "vitest";
import {
  buildFneSearch,
  DEFAULT_FNE_FILTERS,
  parseFneFilters,
} from "@/features/panels/fne/fneFilters";
import { buildFneWhere } from "@/features/panels/fne/fneSql";

describe("parseFneFilters", () => {
  it("keeps valid filters and normalises the state code", () => {
    expect(
      parseFneFilters({
        ano: "2023",
        visao: "valor",
        semiarido: "nao",
        bioma: "Caatinga",
        uf: "pe",
        mun: "2611606,2304400",
      }),
    ).toEqual({
      ano: 2023,
      visao: "valor",
      semiarido: "nao",
      bioma: "Caatinga",
      uf: "PE",
      muns: ["2611606", "2304400"],
    });
  });

  it("drops values outside the panel's options", () => {
    expect(
      parseFneFilters({
        ano: "2019",
        visao: "ticket",
        semiarido: "talvez",
        bioma: "Pampa",
        uf: "Pernambuco",
        mun: "26116",
      }),
    ).toEqual(DEFAULT_FNE_FILTERS);
  });
});

describe("buildFneSearch", () => {
  it("omits defaults and round-trips through the parser", () => {
    const filters = { ...DEFAULT_FNE_FILTERS, bioma: "Cerrado" as const };

    expect(buildFneSearch(DEFAULT_FNE_FILTERS)).toBe("");
    expect(buildFneSearch(filters)).toBe("?bioma=Cerrado");
    expect(parseFneFilters({ bioma: "Cerrado" })).toEqual(filters);
  });

  it("writes several municipalities as one comma-separated value", () => {
    const filters = { ...DEFAULT_FNE_FILTERS, muns: ["2611606", "2304400"] };
    const search = new URLSearchParams(buildFneSearch(filters));

    expect(search.get("mun")).toBe("2611606,2304400");
    expect(parseFneFilters(Object.fromEntries(search))).toEqual(filters);
  });
});

describe("buildFneWhere", () => {
  it("passes every value as a parameter and maps semiárido to the column value", () => {
    const where = buildFneWhere(
      {
        ano: 2025,
        visao: "quantidade",
        semiarido: "nao",
        uf: "BA",
        muns: ["2927408", "2910800"],
      },
      { byUf: true, byMunicipality: true },
    );

    expect(where.sql).toBe(
      "i.fne_ano = $1 AND i.semi_21 = $2 AND i.sigla_uf = $3 AND i.cd_mun = ANY($4)",
    );
    expect(where.params).toEqual([2025, "Não", "BA", [2927408, 2910800]]);
  });

  it("leaves state and municipality out when the scope says so", () => {
    const where = buildFneWhere(
      { ano: 2021, visao: "valor", uf: "BA", muns: ["2927408"] },
      { byUf: false, byMunicipality: false },
    );

    expect(where).toEqual({ sql: "i.fne_ano = $1", params: [2021] });
  });
});
