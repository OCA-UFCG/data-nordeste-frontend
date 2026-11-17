import { describe, expect, it } from "vitest";
import {
  buildPibBigNumbers,
  describePibChangePill,
} from "@/features/panels/pib/pibBigNumbers";

const SERIE = [
  { ano: 2018, pib: 100, perCapita: 0 },
  { ano: 2019, pib: 110, perCapita: 20 },
  { ano: 2020, pib: 99, perCapita: 20 },
];

describe("describePibChangePill", () => {
  it("names the first year of the series", () => {
    expect(describePibChangePill(SERIE, 0, (point) => point.pib)).toEqual({
      text: "Primeiro ano da série",
      direction: "flat",
    });
  });

  it("shows the change to the previous year with its direction", () => {
    expect(describePibChangePill(SERIE, 1, (point) => point.pib)).toEqual({
      text: "+10,0% em relação a 2018",
      direction: "up",
    });
    expect(
      describePibChangePill(SERIE, 2, (point) => point.pib)?.direction,
    ).toBe("down");
  });

  it("has no pill when the previous year is zero, instead of calling it the first year", () => {
    expect(
      describePibChangePill(SERIE, 1, (point) => point.perCapita),
    ).toBeNull();
  });
});

describe("buildPibBigNumbers", () => {
  it("returns the total and per capita of the chosen year", () => {
    const [pib, perCapita] = buildPibBigNumbers(SERIE, 2019);

    expect(pib).toMatchObject({ key: "pib", label: "PIB", value: 110 });
    expect(perCapita).toMatchObject({
      key: "perCapita",
      value: 20,
      pill: null,
    });
  });

  it("has no value nor pill when the year is missing from the series", () => {
    expect(buildPibBigNumbers(SERIE, 2023).map((cell) => cell.value)).toEqual([
      null,
      null,
    ]);
    expect(buildPibBigNumbers(SERIE, 2023).map((cell) => cell.pill)).toEqual([
      null,
      null,
    ]);
  });
});
