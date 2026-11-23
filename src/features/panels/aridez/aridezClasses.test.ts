import { describe, expect, it } from "vitest";
import {
  asdArea,
  asdShare,
  classifiedArea,
  classShares,
  EMPTY_ARIDEZ_AREAS,
  rankAridezClasses,
} from "@/features/panels/aridez/aridezClasses";

const AREAS = { arido: 10, semiarido: 770, subumido: 230, umido: 540 };

describe("aridez classes", () => {
  it("sums the four classes as the classified area", () => {
    expect(classifiedArea(AREAS)).toBe(1550);
  });

  it("leaves the humid class out of the ASD", () => {
    expect(asdArea(AREAS)).toBe(1010);
    expect(asdShare(AREAS)).toBeCloseTo(65.16, 2);
  });

  it("returns zero shares without classified area", () => {
    expect(asdShare(EMPTY_ARIDEZ_AREAS)).toBe(0);
    expect(classShares(EMPTY_ARIDEZ_AREAS).umido).toBe(0);
  });

  it("ranks classes with area from the largest, keeping index order on ties", () => {
    const ranked = rankAridezClasses({
      arido: 0,
      semiarido: 5,
      subumido: 5,
      umido: 9,
    });

    expect(ranked.map(({ item }) => item.key)).toEqual([
      "umido",
      "semiarido",
      "subumido",
    ]);
  });
});
