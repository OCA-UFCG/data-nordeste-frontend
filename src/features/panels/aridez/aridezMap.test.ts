import { describe, expect, it } from "vitest";
import {
  aridezClassCounts,
  aridezMapValues,
} from "@/features/panels/aridez/aridezMap";
import type { AridezMunicipio } from "@/features/panels/aridez/aridezPanel";

const town = (
  cdMun: string,
  arido: number,
  semiarido: number,
  subumido: number,
  umido: number,
): AridezMunicipio => ({
  cdMun,
  nome: cdMun,
  areas: { arido, semiarido, subumido, umido },
});

describe("aridezMapValues", () => {
  it("maps each municipality code to its ASD share of the classified area", () => {
    const values = aridezMapValues([
      town("1", 10, 20, 10, 60),
      town("2", 0, 0, 0, 100),
    ]);

    expect(values.get("1")).toBeCloseTo(40);
    expect(values.get("2")).toBe(0);
    expect(values.size).toBe(2);
  });

  it("gives 0 to a municipality without classified area", () => {
    expect(aridezMapValues([town("3", 0, 0, 0, 0)]).get("3")).toBe(0);
  });

  it("is empty without municipalities", () => {
    expect(aridezMapValues([]).size).toBe(0);
  });
});

describe("aridezClassCounts", () => {
  it("counts the municipalities where each class has the largest area", () => {
    const counts = aridezClassCounts([
      town("1", 50, 20, 10, 5),
      town("2", 0, 30, 20, 10),
      town("3", 0, 10, 60, 10),
      town("4", 0, 0, 0, 5),
      town("5", 0, 40, 0, 10),
    ]);

    expect(counts.get(2)).toBe(1);
    expect(counts.get(3)).toBe(2);
    expect(counts.get(4)).toBe(1);
    expect(counts.get(5)).toBe(1);
  });

  it("uses the numeric dn_uni code of the class as key", () => {
    expect([...aridezClassCounts([town("1", 0, 9, 0, 0)]).keys()]).toEqual([3]);
  });

  it("breaks a tie in favour of the drier class", () => {
    const counts = aridezClassCounts([town("1", 0, 10, 10, 0)]);

    expect(counts.get(3)).toBe(1);
    expect(counts.has(4)).toBe(false);
  });

  it("skips municipalities without classified area", () => {
    expect(aridezClassCounts([town("1", 0, 0, 0, 0)]).size).toBe(0);
  });
});
