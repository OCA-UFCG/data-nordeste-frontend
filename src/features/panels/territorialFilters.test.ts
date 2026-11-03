import { describe, expect, it } from "vitest";
import {
  buildTerritorialSearch,
  defaultTerritorialFilters,
  listYears,
  parseMunicipalityCodes,
  parseTerritorialFilters,
  serializeMunicipalityCodes,
} from "@/features/panels/territorialFilters";

const RANGE = { first: 2010, last: 2023 };
const DEFAULTS = defaultTerritorialFilters(RANGE);
const parse = (params: Record<string, string | string[]>, maxPlaces = 1) =>
  parseTerritorialFilters(params, RANGE, maxPlaces);

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
    ).toEqual({
      ano: 2017,
      area: "semiarido",
      uf: ["PE"],
      mun: ["2611606"],
    });
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

  // Primeiro valor válido: um inválido antes dele não ocupa a única vaga.
  it("uses the first value when a param is repeated", () => {
    expect(parse({ ano: ["2015", "2016"] }).ano).toBe(2015);
    expect(parse({ uf: ["PB", "PE"], mun: ["x", "2611606"] })).toEqual({
      ...DEFAULTS,
      uf: ["PB"],
      mun: ["2611606"],
    });
  });

  it("reads repeated states and municipalities when several are allowed", () => {
    expect(
      parse(
        {
          uf: ["pb", "PE", "PB", "Paraíba"],
          mun: ["2507507", "26116", "2611606"],
        },
        10,
      ),
    ).toEqual({
      ...DEFAULTS,
      uf: ["PB", "PE"],
      mun: ["2507507", "2611606"],
    });
  });

  // Inválidos e repetidos não ocupam vaga: o limite conta só o que é válido.
  it("caps after dropping invalid and repeated codes", () => {
    const valid = Array.from({ length: 100 }, (_, index) =>
      String(2600000 + index),
    );
    const mun = ["x", "26116", valid[0], ...valid, "abc"];

    expect(parse({ mun }, 100).mun).toEqual(valid);
    expect(parse({ uf: ["Paraíba", "pb", "PB", "PE"] }, 2).uf).toEqual([
      "PB",
      "PE",
    ]);
  });
});

describe("buildTerritorialSearch", () => {
  it("omits defaults so the base URL stays clean", () => {
    expect(buildTerritorialSearch(DEFAULTS, RANGE)).toBe("");
  });

  it("round-trips through parseTerritorialFilters", () => {
    const filters = { ano: 2012, area: "caatinga" as const, uf: ["BA"] };
    const search = buildTerritorialSearch(filters, RANGE);

    expect(search).toBe("?ano=2012&area=caatinga&uf=BA");
    expect(parse(Object.fromEntries(new URLSearchParams(search)))).toEqual(
      filters,
    );
  });

  it("repeats the param for several places", () => {
    const search = buildTerritorialSearch(
      { ...DEFAULTS, uf: ["PB", "PE"], mun: ["2507507", "2611606"] },
      RANGE,
    );
    const params = new URLSearchParams(search);

    expect(search).toBe("?uf=PB&uf=PE&mun=2507507&mun=2611606");
    expect(
      parse({ uf: params.getAll("uf"), mun: params.getAll("mun") }, 10),
    ).toEqual({ ...DEFAULTS, uf: ["PB", "PE"], mun: ["2507507", "2611606"] });
  });
});

describe("listYears", () => {
  it("lists the range from the latest year", () => {
    expect(listYears({ first: 2021, last: 2023 })).toEqual([2023, 2022, 2021]);
  });
});

describe("parseMunicipalityCodes", () => {
  it("keeps valid unique codes in order", () => {
    expect(parseMunicipalityCodes("2611606,abc,2611606,2304400")).toEqual([
      "2611606",
      "2304400",
    ]);
  });

  it("accepts a single code and an empty value", () => {
    expect(parseMunicipalityCodes("2611606")).toEqual(["2611606"]);
    expect(parseMunicipalityCodes(undefined)).toEqual([]);
  });

  it("round-trips through serializeMunicipalityCodes", () => {
    const codes = ["2611606", "2304400"];

    expect(parseMunicipalityCodes(serializeMunicipalityCodes(codes))).toEqual(
      codes,
    );
  });
});
