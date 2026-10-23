import { describe, expect, it } from "vitest";
import {
  formatNumber,
  formatPercent,
  formatReais,
  formatReaisAxis,
  formatReaisCompact,
} from "@/features/panels/format";

describe("formatReaisCompact", () => {
  it("matches the Power BI cards for Nordeste 2017 in pt-BR words", () => {
    expect(formatReaisCompact(953_430_000_000)).toBe("R$ 953,43 bi");
    expect(formatReaisCompact(16_652.57)).toBe("R$ 16,65 mil");
  });

  it("scales to trillions and millions", () => {
    expect(formatReaisCompact(1_513_060_000_000)).toBe("R$ 1,51 tri");
    expect(formatReaisCompact(500_000_000, 0)).toBe("R$ 500 mi");
  });

  it("keeps small values unscaled", () => {
    expect(formatReaisCompact(950)).toBe("R$ 950");
  });
});

describe("formatReaisAxis", () => {
  it("drops decimals only when the tick is a whole number in its scale", () => {
    expect(formatReaisAxis(2e12)).toBe("R$ 2 tri");
    expect(formatReaisAxis(1.5e12)).toBe("R$ 1,5 tri");
    expect(formatReaisAxis(900e9)).toBe("R$ 900 bi");
    expect(formatReaisAxis(0)).toBe("R$ 0");
  });
});

describe("formatPercent", () => {
  it("uses a decimal comma", () => {
    expect(formatPercent(31.949, 2)).toBe("31,95%");
  });
});

describe("formatNumber and formatReais", () => {
  it("use pt-BR separators", () => {
    expect(formatNumber(54_658_515)).toBe("54.658.515");
    expect(formatNumber(0.7021, 3)).toBe("0,702");
    expect(formatReais(467.43)).toBe("R$ 467,43");
  });
});
