import { describe, expect, it } from "vitest";
import {
  formatPibAxis,
  formatPibReais,
  formatPibTick,
  formatPibUnit,
} from "@/features/panels/pib/pibFormat";

describe("formatPibReais", () => {
  it("writes the value in its own scale with a capitalised unit", () => {
    expect(formatPibReais(1_513_055_000_000)).toBe("R$ 1,51 Tri");
    expect(formatPibReais(232_239_000_000)).toBe("R$ 232,24 Bi");
    expect(formatPibReais(27_682)).toBe("R$ 27,68 Mil");
  });
});

describe("formatPibAxis", () => {
  it("writes the tick in the axis unit, without currency or scale", () => {
    const bilhoes = { divisor: 1e9, label: "bilhões" };
    const mil = { divisor: 1e3, label: "mil" };

    expect(formatPibAxis(0, bilhoes)).toBe("0");
    expect(formatPibAxis(400_000_000_000, bilhoes)).toBe("400");
    expect(formatPibAxis(1_600_000_000_000, bilhoes)).toBe("1.600");
    expect(formatPibAxis(8_000, mil)).toBe("8");
    expect(formatPibAxis(2_500, mil)).toBe("2,5");
  });
});

describe("formatPibTick", () => {
  it("keeps at most two decimals", () => {
    expect(formatPibTick(120)).toBe("120");
    expect(formatPibTick(0.3)).toBe("0,3");
    expect(formatPibTick(1.255)).toBe("1,26");
  });
});

describe("formatPibUnit", () => {
  it("matches the abbreviations of the value labels", () => {
    const unit = (label: string) => ({ divisor: 1, label });

    expect(formatPibUnit(unit("trilhões"))).toBe("R$ trilhões (Tri)");
    expect(formatPibUnit(unit("bilhões"))).toBe("R$ bilhões (Bi)");
    expect(formatPibUnit(unit("milhões"))).toBe("R$ milhões (Mi)");
    expect(formatPibUnit(unit("mil"))).toBe("R$ mil (Mil)");
    expect(formatPibUnit(unit("reais"))).toBe("R$");
  });
});
