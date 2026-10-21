import { describe, expect, it } from "vitest";
import { parsePibSelection, toPibSelectionQuery } from "./pibSelection";

describe("parsePibSelection", () => {
  it("defaults to the SUDENE area without state or municipality", () => {
    expect(parsePibSelection(new URLSearchParams())).toEqual({
      area: "aas_21",
      uf: null,
      municipio: null,
    });
  });

  it("reads a full selection", () => {
    expect(
      parsePibSelection(new URLSearchParams("area=ne&uf=PB&municipio=2504009")),
    ).toEqual({ area: "ne", uf: "PB", municipio: 2504009 });
  });

  it.each([
    ["area=ne;drop", 'area "ne;drop"'],
    ["uf=pb", 'uf "pb"'],
    ["municipio=25a", 'municipio "25a"'],
  ])("rejects %s with the offending value", (query, message) => {
    expect(() => parsePibSelection(new URLSearchParams(query))).toThrow(
      message,
    );
  });
});

describe("toPibSelectionQuery", () => {
  it("leaves empty filters out", () => {
    expect(toPibSelectionQuery({ area: "ne", uf: null, municipio: null })).toBe(
      "area=ne",
    );
    expect(
      toPibSelectionQuery({ area: "ne", uf: "PB", municipio: 2504009 }),
    ).toBe("area=ne&uf=PB&municipio=2504009");
  });
});
