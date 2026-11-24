import { describe, expect, it } from "vitest";
import { resolvePerfilCardStates } from "@/features/panels/demografia/perfilCardState";
import type { TerritorialFilters } from "@/features/panels/territorialFilters";

const filters: TerritorialFilters = { ano: 2022, area: "nordeste" };
const idle = { failed: false, retrying: false };

describe("resolvePerfilCardStates", () => {
  it("keeps every card ok when nothing is pending", () => {
    const states = resolvePerfilCardStates({ ...idle, pending: null }, filters);

    expect(new Set(Object.values(states))).toEqual(new Set(["ok"]));
  });

  it("keeps the census series when only the year changes", () => {
    const states = resolvePerfilCardStates(
      { ...idle, pending: { ...filters, ano: 2010 } },
      filters,
    );

    expect(states.serie).toBe("ok");
    expect(states.piramide).toBe("stale");
  });

  it("keeps the map when only the municipality changes", () => {
    const states = resolvePerfilCardStates(
      { ...idle, pending: { ...filters, mun: ["2504009"] } },
      filters,
    );

    expect(states.map).toBe("ok");
    expect(states.municipios).toBe("stale");
  });

  it("shows loading on every card while retrying a failed load", () => {
    const states = resolvePerfilCardStates(
      { failed: true, retrying: true, pending: null },
      filters,
    );

    expect(new Set(Object.values(states))).toEqual(new Set(["loading"]));
  });
});
