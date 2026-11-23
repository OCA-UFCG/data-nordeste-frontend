import { describe, expect, it } from "vitest";
import {
  describeYearChange,
  formatYearChange,
  yearChangeTone,
} from "@/features/panels/yearChange";

const SERIE = [
  { label: "2019", value: 0 },
  { label: "2020", value: 100 },
  { label: "2021", value: 108.2 },
  { label: "2022", value: 107.66 },
];

describe("describeYearChange", () => {
  it("compares with the previous point and names its year", () => {
    expect(formatYearChange(describeYearChange(SERIE, 2)!)).toBe(
      "+8,2% em relação a 2020",
    );
    expect(formatYearChange(describeYearChange(SERIE, 3)!)).toBe(
      "-0,5% em relação a 2021",
    );
  });

  it("accepts another connector", () => {
    expect(formatYearChange(describeYearChange(SERIE, 2)!, "vs.")).toBe(
      "+8,2% vs. 2020",
    );
  });

  it("has nothing to say for the first year or after a zero", () => {
    expect(describeYearChange(SERIE, 0)).toBeNull();
    expect(describeYearChange(SERIE, 1)).toBeNull();
    expect(describeYearChange(SERIE, -1)).toBeNull();
  });
});

describe("yearChangeTone", () => {
  it("is up or down by the sign of the change", () => {
    expect(yearChangeTone({ ratio: 0.03, previousLabel: "2010" })).toBe("up");
    expect(yearChangeTone({ ratio: -0.03, previousLabel: "2010" })).toBe(
      "down",
    );
  });

  it("is flat when the shown one-decimal percentage is zero", () => {
    expect(yearChangeTone({ ratio: 0, previousLabel: "2010" })).toBe("flat");
    expect(yearChangeTone({ ratio: 0.0004, previousLabel: "2010" })).toBe(
      "flat",
    );
    expect(yearChangeTone({ ratio: -0.0004, previousLabel: "2010" })).toBe(
      "flat",
    );
  });
});
