import { describe, expect, it } from "vitest";
import {
  filterMunicipalitySuggestions,
  resolveMunicipality,
} from "./municipalitySearch";

const CITIES = ["Campina Grande", "João Pessoa", "São Luís", "Recife"];

describe("resolveMunicipality", () => {
  it("resolves a query written without accents to the canonical city name", () => {
    expect(resolveMunicipality("sao luis", CITIES)).toBe("São Luís");
  });

  it("is case-insensitive and tolerant of extra whitespace", () => {
    expect(resolveMunicipality("  JOÃO  PESSOA ", CITIES)).toBe("João Pessoa");
  });

  it("returns null for an empty query or a non-matching city", () => {
    expect(resolveMunicipality("", CITIES)).toBeNull();
    expect(resolveMunicipality("   ", CITIES)).toBeNull();
    expect(resolveMunicipality("Fortaleza", CITIES)).toBeNull();
  });
});

describe("filterMunicipalitySuggestions", () => {
  it("matches by accent-insensitive prefix", () => {
    expect(filterMunicipalitySuggestions("sao", CITIES)).toEqual(["São Luís"]);
    expect(filterMunicipalitySuggestions("joao", CITIES)).toEqual([
      "João Pessoa",
    ]);
  });

  it("preserves the original cities order", () => {
    const shuffled = ["São Luís", "Campina Grande", "Recife", "João Pessoa"];
    expect(filterMunicipalitySuggestions("", shuffled)).toEqual(shuffled);
    expect(filterMunicipalitySuggestions("sa", shuffled)).toEqual(["São Luís"]);
  });

  it("caps the empty-query list to a fixed suggestion count", () => {
    const manyCities = Array.from(
      { length: 30 },
      (_, index) => `Cidade ${index}`,
    );
    const suggestions = filterMunicipalitySuggestions("", manyCities);

    expect(suggestions).toHaveLength(8);
  });
});
