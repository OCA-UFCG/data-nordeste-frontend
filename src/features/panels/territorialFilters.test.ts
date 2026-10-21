import { describe, expect, it } from "vitest";
import {
  buildTerritorialSearch,
  defaultTerritorialFilters,
  listYears,
  parseTerritorialFilters,
} from "@/features/panels/territorialFilters";

const RANGE = { first: 2010, last: 2023 };
const DEFAULTS = defaultTerritorialFilters(RANGE);
const parse = (params: Record<string, string | string[]>) =>
  parseTerritorialFilters(params, RANGE);

describe("parseTerritorialFilters", () => {
  it("defaults to the latest year in the Nordeste", () => {
    expect(parse({})).toEqual(DEFAULTS);
  });

  it("accepts valid year, area, state and municipality", () => {
    expect(
      parse({
        ano: "2017",
        area: "semiarido",
        uf: "pe",
        mun: "2611606",
      }),
    ).toEqual({ ano: 2017, area: "semiarido", uf: "PE", mun: "2611606" });
  });

  it("drops values outside the expected shape", () => {
    expect(
      parse({
        ano: "1999",
        area: "nordeste; DROP TABLE",
        uf: "Pernambuco",
        mun: "26116",
      }),
    ).toEqual(DEFAULTS);
  });

  it("uses the first value when a param is repeated", () => {
    expect(parse({ ano: ["2015", "2016"] }).ano).toBe(2015);
  });
});

describe("buildTerritorialSearch", () => {
  it("omits defaults so the base URL stays clean", () => {
    expect(buildTerritorialSearch(DEFAULTS, RANGE)).toBe("");
  });

  it("round-trips through parseTerritorialFilters", () => {
    const filters = { ano: 2012, area: "caatinga", uf: "BA" } as const;
    const search = new URLSearchParams(buildTerritorialSearch(filters, RANGE));

    expect(parse(Object.fromEntries(search))).toEqual(filters);
  });
});

describe("listYears", () => {
  it("lists the range from the latest year", () => {
    expect(listYears({ first: 2021, last: 2023 })).toEqual([2023, 2022, 2021]);
  });
});
