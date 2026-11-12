import { describe, expect, it } from "vitest";
import {
  filterMunicipalitySuggestions,
  MAX_MUNICIPALITY_SUGGESTIONS,
  resolveMunicipality,
} from "./municipalitySearch";

const CITIES = ["Campina Grande", "João Pessoa", "São Luís", "Recife"];
const CITY_PLACES = { states: [], areas: [], cities: CITIES };

// Same order as the backend's utils/data/estados.py: Bahia comes last.
const NORTHEAST_STATES = [
  "Alagoas",
  "Ceará",
  "Maranhão",
  "Paraíba",
  "Pernambuco",
  "Piauí",
  "Rio Grande do Norte",
  "Sergipe",
  "Bahia",
];

describe("resolveMunicipality", () => {
  it("resolves a query written without accents to the canonical city name", () => {
    expect(resolveMunicipality("sao luis", CITY_PLACES)).toBe("São Luís");
  });

  it("is case-insensitive and tolerant of extra whitespace", () => {
    expect(resolveMunicipality("  JOÃO  PESSOA ", CITY_PLACES)).toBe(
      "João Pessoa",
    );
  });

  it("returns null for an empty query or a non-matching city", () => {
    expect(resolveMunicipality("", CITY_PLACES)).toBeNull();
    expect(resolveMunicipality("   ", CITY_PLACES)).toBeNull();
    expect(resolveMunicipality("Fortaleza", CITY_PLACES)).toBeNull();
  });
});

describe("filterMunicipalitySuggestions", () => {
  it("matches by accent-insensitive prefix", () => {
    expect(filterMunicipalitySuggestions("sao", CITY_PLACES)).toEqual([
      "São Luís",
    ]);
    expect(filterMunicipalitySuggestions("joao", CITY_PLACES)).toEqual([
      "João Pessoa",
    ]);
  });

  it("preserves the original cities order", () => {
    const shuffled = ["São Luís", "Campina Grande", "Recife", "João Pessoa"];
    const places = { states: [], areas: [], cities: shuffled };
    expect(filterMunicipalitySuggestions("", places)).toEqual(shuffled);
    expect(filterMunicipalitySuggestions("sa", places)).toEqual(["São Luís"]);
  });

  it("caps the empty-query municipalities to a fixed suggestion count", () => {
    const manyCities = Array.from(
      { length: 30 },
      (_, index) => `Cidade ${index}`,
    );
    const suggestions = filterMunicipalitySuggestions("", {
      states: [],
      areas: [],
      cities: manyCities,
    });

    expect(suggestions).toHaveLength(MAX_MUNICIPALITY_SUGGESTIONS);
  });
});

describe("states in the report search", () => {
  const PLACES = {
    states: ["Paraíba", "Pernambuco"],
    areas: [],
    cities: ["Paraibano (MA)", "Recife (PE)"],
  };

  it("suggests the state above the cities that share its prefix", () => {
    expect(filterMunicipalitySuggestions("paraiba", PLACES)).toEqual([
      "Paraíba",
      "Paraibano (MA)",
    ]);
  });

  it("resolves a state name without accents to the state, not to a city", () => {
    expect(resolveMunicipality("paraiba", PLACES)).toBe("Paraíba");
  });

  it("shows all nine states plus municipalities on an empty search", () => {
    const manyCities = Array.from(
      { length: 30 },
      (_, index) => `Cidade ${index} (PE)`,
    );
    const suggestions = filterMunicipalitySuggestions("", {
      states: NORTHEAST_STATES,
      areas: [],
      cities: manyCities,
    });

    expect(suggestions).toEqual([
      ...NORTHEAST_STATES,
      ...manyCities.slice(0, MAX_MUNICIPALITY_SUGGESTIONS),
    ]);
    expect(suggestions).toContain("Bahia");
  });
});
