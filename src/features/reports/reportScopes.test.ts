import { describe, expect, it } from "vitest";
import {
  findReportScope,
  groupReportScopes,
  selectReportScopePlaces,
} from "@/features/reports/reportScopes";

const PLACES = {
  states: ["Alagoas", "Bahia"],
  cities: ["Recife (PE)", "Maceió (AL)"],
};

describe("groupReportScopes", () => {
  it("offers only the scopes Automatic-Reporting can generate", () => {
    const groups = groupReportScopes();

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
      cities: [],
    });
  });

  it("keeps only municipalities for the municipality scope", () => {
    expect(selectReportScopePlaces("municipio", PLACES)).toEqual({
      states: [],
      cities: ["Recife (PE)", "Maceió (AL)"],
    });
  });

  it("returns no places before a scope is chosen", () => {
    expect(selectReportScopePlaces(null, PLACES)).toEqual({
      states: [],
      cities: [],
    });
  });
});
