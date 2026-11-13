import { describe, expect, it } from "vitest";
import {
  findReportScope,
  getScopeAreaName,
  groupReportScopes,
  isThemeAvailableInScope,
  selectReportScopePlaces,
} from "@/features/reports/reportScopes";

const PLACES = {
  states: ["Alagoas", "Bahia"],
  areas: ["Caatinga"],
  cities: ["Recife (PE)", "Maceió (AL)"],
};

describe("groupReportScopes", () => {
  it("offers only Município and Estado when the backend lists no area", () => {
    const groups = groupReportScopes([]);

    expect(groups.map((group) => group.label)).toEqual([
      "Recortes geopolíticos",
    ]);
    expect(groups[0].scopes.map((scope) => scope.label)).toEqual([
      "Município",
      "Estado",
    ]);
  });
});

describe("findReportScope", () => {
  it("returns null when no scope is chosen", () => {
    expect(findReportScope(null)).toBeNull();
  });
});

describe("selectReportScopePlaces", () => {
  it("keeps only states for the state scope", () => {
    expect(selectReportScopePlaces("estado", PLACES)).toEqual({
      states: ["Alagoas", "Bahia"],
      areas: [],
      cities: [],
    });
  });

  it("keeps only municipalities for the municipality scope", () => {
    expect(selectReportScopePlaces("municipio", PLACES)).toEqual({
      states: [],
      areas: [],
      cities: ["Recife (PE)", "Maceió (AL)"],
    });
  });

  it("returns no places before a scope is chosen", () => {
    expect(selectReportScopePlaces(null, PLACES)).toEqual({
      states: [],
      areas: [],
      cities: [],
    });
  });
});

describe("area scopes", () => {
  const ALL_AREAS = [
    "Caatinga",
    "Área de atuação da Sudene",
    "Semiárido",
    "Nordeste",
  ];

  it("puts Nordeste with the geopolitical scopes and the other areas apart, as in the Figma", () => {
    const groups = groupReportScopes(ALL_AREAS);

    expect(
      groups.map((group) => [
        group.label,
        group.scopes.map((scope) => scope.label),
      ]),
    ).toEqual([
      ["Recortes geopolíticos", ["Município", "Estado", "Nordeste"]],
      [
        "Recortes estratégicos",
        ["Caatinga", "Semiárido", "Área de atuação da Sudene"],
      ],
    ]);
  });

  it("hides an area the backend does not list", () => {
    const labels = groupReportScopes(["Caatinga"]).flatMap((group) =>
      group.scopes.map((scope) => scope.label),
    );

    expect(labels).toEqual(["Município", "Estado", "Caatinga"]);
  });

  it("narrows the places to the area itself, and to nothing when the backend lacks it", () => {
    expect(selectReportScopePlaces("caatinga", PLACES)).toEqual({
      states: [],
      areas: ["Caatinga"],
      cities: [],
    });
    expect(selectReportScopePlaces("nordeste", PLACES)).toEqual({
      states: [],
      areas: [],
      cities: [],
    });
  });

  it("gives the area name only for area scopes", () => {
    expect(getScopeAreaName(findReportScope("area-sudene"))).toBe(
      "Área de atuação da Sudene",
    );
    expect(getScopeAreaName(findReportScope("estado"))).toBeNull();
  });
});

describe("isThemeAvailableInScope", () => {
  it("leaves out the themes with no area data in area scopes", () => {
    expect(isThemeAvailableInScope("desenvolvimento_social", "caatinga")).toBe(
      false,
    );
    expect(isThemeAvailableInScope("instrumentos_sudene", "nordeste")).toBe(
      false,
    );
    expect(isThemeAvailableInScope("demografia", "caatinga")).toBe(true);
    expect(isThemeAvailableInScope("desenvolvimento_social", null)).toBe(true);
  });

  it("leaves out only Instrumentos Sudene under Estado and keeps it for Município", () => {
    expect(isThemeAvailableInScope("desenvolvimento_social", "estado")).toBe(
      true,
    );
    expect(isThemeAvailableInScope("instrumentos_sudene", "estado")).toBe(
      false,
    );
    expect(isThemeAvailableInScope("demografia", "estado")).toBe(true);
    expect(isThemeAvailableInScope("instrumentos_sudene", "municipio")).toBe(
      true,
    );
  });

  it("never offers a theme without a report", () => {
    expect(isThemeAvailableInScope("cultura", "municipio")).toBe(false);
  });
});
