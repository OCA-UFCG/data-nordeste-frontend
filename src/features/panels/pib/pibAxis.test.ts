import { describe, expect, it } from "vitest";
import { buildZeroAxis } from "@/features/panels/pib/pibAxis";

describe("buildZeroAxis", () => {
  it("covers the highest value in four round steps from zero", () => {
    expect(buildZeroAxis(1513)).toEqual({
      max: 1600,
      step: 400,
      ticks: [0, 400, 800, 1200, 1600],
    });
  });

  it("keeps the step when the value lands exactly on the last tick", () => {
    expect(buildZeroAxis(100).ticks).toEqual([0, 25, 50, 75, 100]);
  });

  it("uses fractional steps without floating point noise", () => {
    expect(buildZeroAxis(1.1).ticks).toEqual([0, 0.3, 0.6, 0.9, 1.2]);
  });

  it("falls back to 0–4 when there is no positive value", () => {
    expect(buildZeroAxis(0)).toEqual({
      max: 4,
      step: 1,
      ticks: [0, 1, 2, 3, 4],
    });
    expect(buildZeroAxis(-5).max).toBe(4);
  });
});
