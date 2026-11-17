import { describe, expect, it } from "vitest";
import {
  formatPibAxis,
  formatPibReais,
  formatPibTick,
} from "@/features/panels/pib/pibFormat";

describe("formatPibReais", () => {
  it("writes the value in its own scale with a capitalised unit", () => {
    expect(formatPibReais(1_513_055_000_000)).toBe("R$ 1,51 Tri");
    expect(formatPibReais(232_239_000_000)).toBe("R$ 232,24 Bi");
    expect(formatPibReais(27_682)).toBe("R$ 27,68 Mil");
  });
});

describe("formatPibAxis", () => {
  it("drops the decimals of round ticks", () => {
    expect(formatPibAxis(0)).toBe("R$ 0");
    expect(formatPibAxis(400_000_000_000)).toBe("R$ 400 Bi");
    expect(formatPibAxis(1_200_000_000_000)).toBe("R$ 1,2 Tri");
    expect(formatPibAxis(10_000)).toBe("R$ 10 Mil");
  });
});

describe("formatPibTick", () => {
  it("keeps at most two decimals", () => {
    expect(formatPibTick(120)).toBe("120");
    expect(formatPibTick(0.3)).toBe("0,3");
    expect(formatPibTick(1.255)).toBe("1,26");
  });
});
