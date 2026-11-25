import { describe, expect, it } from "vitest";
import {
  aridezClassCounts,
  aridezMapValues,
  aridezPredominantClasses,
  aridezStateShares,
} from "@/features/panels/aridez/aridezMap";
import type { AridezMunicipio } from "@/features/panels/aridez/aridezPanel";

const town = (
  cdMun: string,
  arido: number,
  semiarido: number,
  subumido: number,
  umido: number,
  uf = "PE",
): AridezMunicipio => ({
  cdMun,
  uf,
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

describe("aridezPredominantClasses", () => {
  it("maps each municipality code to the dn_uni of its largest class", () => {
    const classOf = aridezPredominantClasses([
      town("1", 50, 20, 10, 5),
      town("2", 0, 30, 20, 10),
      town("3", 0, 10, 10, 0),
    ]);

    expect([...classOf]).toEqual([
      ["1", 2],
      ["2", 3],
      ["3", 3],
    ]);
  });

  it("leaves out municipalities without classified area", () => {
    expect(aridezPredominantClasses([town("1", 0, 0, 0, 0)]).size).toBe(0);
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

describe("aridezStateShares", () => {
  it("gives each state the ASD share of its summed classified area", () => {
    // PE: (100 + 0) de (100 + 900) = 10%. A média dos % seria (100 + 0) / 2 = 50.
    const shares = aridezStateShares([
      town("1", 0, 100, 0, 0, "PE"),
      town("2", 0, 0, 0, 900, "PE"),
      town("3", 10, 0, 10, 20, "PB"),
    ]);

    expect(shares.get("PE")).toBeCloseTo(10);
    expect(shares.get("PB")).toBeCloseTo(50);
  });

  it("counts every ASD class (arid, semiarid and dry subhumid), not the humid", () => {
    const shares = aridezStateShares([town("1", 1, 1, 1, 1, "CE")]);

    expect(shares.get("CE")).toBeCloseTo(75);
  });

  it("leaves out a state without classified area", () => {
    expect(aridezStateShares([town("1", 0, 0, 0, 0, "RN")]).has("RN")).toBe(
      false,
    );
  });
});
