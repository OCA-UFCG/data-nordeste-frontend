import { describe, expect, it } from "vitest";
import { resolvePibCardStates } from "@/features/panels/pib/pibCardState";
import type { TerritorialFilters } from "@/features/panels/territorialFilters";

const CURRENT: TerritorialFilters = { ano: 2021, area: "nordeste" };

const resolve = (pending: TerritorialFilters | null) =>
  resolvePibCardStates({ failed: false, retrying: false, pending }, CURRENT);

describe("resolvePibCardStates", () => {
  it("keeps every card as it is with no pending filter", () => {
    expect(resolve(null)).toEqual({
      bigNumbers: "ok",
      evolution: "ok",
      map: "ok",
      sectors: "ok",
    });
  });

  it("leaves the map alone when only the municipality changes", () => {
    expect(resolve({ ...CURRENT, mun: ["2611606"] })).toEqual({
      bigNumbers: "stale",
      evolution: "stale",
      map: "ok",
      sectors: "stale",
    });
  });

  it("dims the map when the state changes, since it zooms to it", () => {
    expect(resolve({ ...CURRENT, uf: ["PE"] }).map).toBe("stale");
  });

  it("leaves the yearly series alone when the year changes", () => {
    expect(resolve({ ...CURRENT, ano: 2020 }).evolution).toBe("ok");
    expect(resolve({ ...CURRENT, ano: 2020 }).map).toBe("stale");
  });

  it("shows skeletons while a failed panel loads again", () => {
    expect(
      resolvePibCardStates(
        { failed: true, retrying: true, pending: null },
        CURRENT,
      ).map,
    ).toBe("loading");
  });
});
