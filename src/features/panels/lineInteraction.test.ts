import { describe, expect, it } from "vitest";
import {
  stepCategory,
  stepYear,
  yearIndexAtPointer,
} from "@/features/panels/lineInteraction";

describe("stepCategory", () => {
  const YEARS = ["2019", "2020", "2021"];

  it("moves one year with the arrows and stops at the ends", () => {
    expect(stepCategory(YEARS, "2020", "ArrowLeft")).toBe("2019");
    expect(stepCategory(YEARS, "2020", "ArrowRight")).toBe("2021");
    expect(stepCategory(YEARS, "2021", "ArrowRight")).toBeNull();
  });

  it("jumps to the first and last year with Home and End", () => {
    expect(stepCategory(YEARS, "2020", "Home")).toBe("2019");
    expect(stepCategory(YEARS, "2020", "End")).toBe("2021");
  });

  it("ignores other keys", () => {
    expect(stepCategory(YEARS, "2020", "Enter")).toBeNull();
  });
});

describe("stepYear", () => {
  const GAPPED = [2018, 2019, 2021];

  it("steps one year with the arrows when the year is in the series", () => {
    expect(stepYear(GAPPED, 2019, "ArrowRight")).toBe(2021);
    expect(stepYear(GAPPED, 2019, "ArrowLeft")).toBe(2018);
  });

  it("goes to the nearest neighbour when the year is missing", () => {
    expect(stepYear(GAPPED, 2020, "ArrowLeft")).toBe(2019);
    expect(stepYear(GAPPED, 2020, "ArrowRight")).toBe(2021);
  });

  it("stays put past the ends and on unrelated keys", () => {
    expect(stepYear(GAPPED, 2022, "ArrowRight")).toBeNull();
    expect(stepYear(GAPPED, 2021, "ArrowRight")).toBeNull();
    expect(stepYear(GAPPED, 2020, "Enter")).toBeNull();
  });

  it("jumps to the ends with Home and End", () => {
    expect(stepYear(GAPPED, 2020, "Home")).toBe(2018);
    expect(stepYear(GAPPED, 2020, "End")).toBe(2021);
  });
});

describe("yearIndexAtPointer", () => {
  const AREA = { left: 100, width: 100 };

  it("rounds the pointer to the nearest year", () => {
    expect(yearIndexAtPointer({ ...AREA, clientX: 100 }, 3)).toBe(0);
    expect(yearIndexAtPointer({ ...AREA, clientX: 140 }, 3)).toBe(1);
    expect(yearIndexAtPointer({ ...AREA, clientX: 200 }, 3)).toBe(2);
  });

  it("clamps the padding outside the first and last points", () => {
    expect(yearIndexAtPointer({ ...AREA, clientX: 105 }, 3, 10)).toBe(0);
    expect(yearIndexAtPointer({ ...AREA, clientX: 195 }, 3, 10)).toBe(2);
  });
});
