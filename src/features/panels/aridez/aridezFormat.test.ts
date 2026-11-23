import { describe, expect, it } from "vitest";
import {
  areaUnit,
  formatAreaCompact,
  formatAreaKm2,
  formatAreaKm2Full,
  formatAreaTick,
  formatSharePercent,
} from "@/features/panels/aridez/aridezFormat";

describe("aridez area formatting", () => {
  it("switches to millions from 100 thousand\u00a0km²", () => {
    expect(formatAreaKm2(1_550_000)).toBe("1,55 Mi\u00a0km²");
    expect(formatAreaCompact(774_300)).toBe("0,77 Mi");
  });

  it("keeps one decimal below 100 thousand and none above", () => {
    expect(formatAreaKm2(12_400)).toBe("12,4 mil\u00a0km²");
    expect(formatAreaCompact(99_999, areaUnit(1e3))).toBe("100,0 mil");
    expect(formatAreaCompact(450_000, areaUnit(5e4))).toBe("450 mil");
  });

  it("writes small areas as whole\u00a0km²", () => {
    expect(formatAreaKm2(640.4)).toBe("640\u00a0km²");
  });

  it("fixes the scale with a unit", () => {
    expect(formatAreaCompact(8000, areaUnit(300_000))).toBe("0,01 Mi");
  });

  it("formats full areas and shares with two decimals", () => {
    expect(formatAreaKm2Full(1234.5)).toBe("1.234,50\u00a0km²");
    expect(formatSharePercent(59.8)).toBe("59,80%");
  });
});

describe("formatAreaTick", () => {
  it("writes axis ticks in the axis unit", () => {
    expect(formatAreaTick(0, areaUnit(774_000))).toBe("0");
    expect(formatAreaTick(0.2, areaUnit(774_000))).toBe("0,2 Mi");
    expect(formatAreaTick(150, areaUnit(5e4))).toBe("150 mil");
  });
});
