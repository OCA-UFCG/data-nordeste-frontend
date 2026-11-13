import { describe, expect, it } from "vitest";
import {
  findPerfilPopulacao,
  perfilChangeTone,
} from "@/features/panels/demografia/perfilPopulacao";

const SERIE = [
  { label: "2000", value: 100 },
  { label: "2010", value: 103 },
  { label: "2022", value: 0 },
];

describe("findPerfilPopulacao", () => {
  it("returns the population of the chosen year and its change to the previous census", () => {
    const populacao = findPerfilPopulacao({
      serie: SERIE,
      filters: { ano: 2010, area: "nordeste" },
    });

    expect(populacao?.value).toBe(103);
    expect(populacao?.change?.previousLabel).toBe("2000");
    expect(populacao?.change?.ratio).toBeCloseTo(0.03);
  });

  it("has no change for the first census", () => {
    expect(
      findPerfilPopulacao({
        serie: SERIE,
        filters: { ano: 2000, area: "nordeste" },
      }),
    ).toEqual({ value: 100, change: null });
  });

  it("is null when the year is missing or its population is zero", () => {
    expect(
      findPerfilPopulacao({
        serie: SERIE,
        filters: { ano: 2022, area: "nordeste" },
      }),
    ).toBeNull();
    expect(
      findPerfilPopulacao({
        serie: [],
        filters: { ano: 2010, area: "nordeste" },
      }),
    ).toBeNull();
  });
});

describe("perfilChangeTone", () => {
  it("is up or down by the sign of the change", () => {
    expect(perfilChangeTone({ ratio: 0.03, previousLabel: "2010" })).toBe("up");
    expect(perfilChangeTone({ ratio: -0.03, previousLabel: "2010" })).toBe(
      "down",
    );
  });

  it("is flat when the shown one-decimal percentage is zero", () => {
    expect(perfilChangeTone({ ratio: 0, previousLabel: "2010" })).toBe("flat");
    expect(perfilChangeTone({ ratio: 0.0004, previousLabel: "2010" })).toBe(
      "flat",
    );
    expect(perfilChangeTone({ ratio: -0.0004, previousLabel: "2010" })).toBe(
      "flat",
    );
  });
});
