import { describe, expect, it } from "vitest";
import { EMPTY_ARIDEZ_AREAS } from "@/features/panels/aridez/aridezClasses";
import { buildAridezStateLookup } from "@/features/panels/aridez/aridezStates";

const CE = {
  code: "CE",
  name: "Ceará",
  areas: EMPTY_ARIDEZ_AREAS,
  value: 91.94,
};

describe("buildAridezStateLookup", () => {
  const lookup = buildAridezStateLookup([CE]);

  it("colors a state by its share of susceptible area", () => {
    expect(lookup.binFor("CE")?.label).toBe("≥ 80%");
    expect(lookup.describe("CE")).toBe("Ceará, 91,9% da área suscetível");
    expect(lookup.isSelectable("CE")).toBe(true);
  });

  it("leaves states outside the area unselectable", () => {
    expect(lookup.binFor("MA")).toBeNull();
    expect(lookup.describe("MA")).toBe("MA, fora da área");
    expect(lookup.isSelectable("MA")).toBe(false);
  });
});
