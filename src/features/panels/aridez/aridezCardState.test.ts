import { describe, expect, it } from "vitest";
import { resolveAridezCardStates } from "@/features/panels/aridez/aridezCardState";
import type { TerritorialFilters } from "@/features/panels/territorialFilters";

const CURRENT: TerritorialFilters = { ano: 2021, area: "nordeste" };

const resolve = (pending: TerritorialFilters | null) =>
  resolveAridezCardStates({ failed: false, retrying: false, pending }, CURRENT);

describe("resolveAridezCardStates", () => {
  it("keeps every card as it is with no pending filter", () => {
    expect(resolve(null)).toEqual({
      bigNumbers: "ok",
      map: "ok",
      classes: "ok",
      municipios: "ok",
    });
  });

  it("leaves the map alone when a state is chosen or the map is zoomed", () => {
    expect(resolve({ ...CURRENT, uf: ["PE"] })).toEqual({
      bigNumbers: "stale",
      map: "ok",
      classes: "stale",
      municipios: "stale",
    });
    expect(resolve({ ...CURRENT, uf: ["PE"], mun: ["2611606"] }).map).toBe(
      "ok",
    );
  });

  it("dims the map, without a skeleton, when the year or the area changes", () => {
    expect(resolve({ ...CURRENT, ano: 2011 }).map).toBe("stale");
    expect(resolve({ ...CURRENT, area: "semiarido" }).map).toBe("stale");
  });

  it("shows skeletons while a failed panel loads again", () => {
    expect(
      resolveAridezCardStates(
        { failed: true, retrying: true, pending: null },
        CURRENT,
      ).map,
    ).toBe("loading");
  });
});
