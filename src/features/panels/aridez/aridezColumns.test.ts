import { describe, expect, it } from "vitest";
import { EMPTY_ARIDEZ_AREAS } from "@/features/panels/aridez/aridezClasses";
import { buildAridezColumns } from "@/features/panels/aridez/aridezColumns";

describe("buildAridezColumns", () => {
  it("puts the axis in the unit of the largest class", () => {
    const columns = buildAridezColumns({
      arido: 10_000,
      semiarido: 774_000,
      subumido: 230_000,
      umido: 540_000,
    });

    expect(columns.unit.suffix).toBe(" Mi");
    expect(columns.axis.ticks).toEqual([0, 0.2, 0.4, 0.6, 0.8]);
    expect(columns.columns[1].height).toBeCloseTo(0.9675, 4);
  });

  it("keeps the four classes in index order with their shares", () => {
    const { columns } = buildAridezColumns({
      ...EMPTY_ARIDEZ_AREAS,
      semiarido: 300,
      umido: 100,
    });

    expect(columns.map(({ item }) => item.label)).toEqual([
      "Árido",
      "Semiárido",
      "Subúmido seco",
      "Úmido",
    ]);
    expect(columns[1].percent).toBe(75);
  });

  it("draws flat columns without area", () => {
    const { columns } = buildAridezColumns(EMPTY_ARIDEZ_AREAS);

    expect(columns.every(({ height }) => height === 0)).toBe(true);
  });
});
