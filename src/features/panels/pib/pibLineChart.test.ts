import { describe, expect, it } from "vitest";
import { buildPibLineGeometry } from "@/features/panels/pib/pibLineChart";
import type { PibYearPoint } from "@/features/panels/pib/pibPanel";

// PIB e per capita do Nordeste no protótipo, 2010 a 2023.
const PIB_BILLIONS = [
  522.769, 583.413, 653.067, 724.524, 805.099, 848.579, 898.362, 953.429,
  1004.827, 1047.766, 1079.331, 1243.103, 1388.05, 1513.055,
];
const PER_CAPITA = [
  9849, 10905, 12118, 12986, 14329, 15003, 15784, 16653, 17703, 18359, 18812,
  21556, 25401, 27682,
];

const SERIE: PibYearPoint[] = PIB_BILLIONS.map((pib, index) => ({
  ano: 2010 + index,
  pib: pib * 1e9,
  perCapita: PER_CAPITA[index],
}));

describe("buildPibLineGeometry", () => {
  it("uses the prototype frame and one round axis per series", () => {
    const geometry = buildPibLineGeometry({
      width: 820,
      serie: SERIE,
      selectedIndex: 13,
    });

    expect(geometry.height).toBe(340);
    expect(geometry.margin).toEqual({
      left: 72,
      right: 72,
      top: 22,
      bottom: 34,
    });
    expect(geometry.ticks.map((tick) => tick.pib)).toEqual([
      0, 4e11, 8e11, 1.2e12, 1.6e12,
    ]);
    expect(geometry.ticks.map((tick) => tick.perCapita)).toEqual([
      0, 10000, 20000, 30000, 40000,
    ]);
    expect(geometry.ticks[0].y).toBe(306);
    expect(geometry.ticks[4].y).toBe(22);
  });

  it("spreads the years from the left to the right margin", () => {
    const geometry = buildPibLineGeometry({
      width: 820,
      serie: SERIE,
      selectedIndex: 13,
    });

    expect(geometry.years[0].x).toBe(72);
    expect(geometry.years[13].x).toBe(748);
    expect(geometry.selectedX).toBe(748);
    expect(geometry.years.every((year) => year.show)).toBe(true);
    expect(geometry.years[13].selected).toBe(true);
  });

  it("keeps the per capita line below the total thanks to its headroom", () => {
    const { points } = buildPibLineGeometry({
      width: 820,
      serie: SERIE,
      selectedIndex: 13,
    });

    expect(points.perCapita[13].y).toBeGreaterThan(points.pib[13].y);
  });

  it("labels the higher series above and the lower one below, left of a late year", () => {
    const { labels, points } = buildPibLineGeometry({
      width: 820,
      serie: SERIE,
      selectedIndex: 13,
    });

    expect(labels.pib).toMatchObject({
      anchor: "end",
      x: points.pib[13].x - 4,
      y: points.pib[13].y - 12,
    });
    expect(labels.perCapita.y).toBe(points.perCapita[13].y + 36);
  });

  it("centres the labels of an earlier year without crossing the left axis", () => {
    const { labels, points } = buildPibLineGeometry({
      width: 820,
      serie: SERIE,
      selectedIndex: 0,
    });

    expect(labels.pib).toMatchObject({ anchor: "middle", x: 72 + 44 });
    expect(labels.perCapita.y).toBe(points.perCapita[0].y + 22);
  });

  it("shrinks below 560 px and shows one year in four", () => {
    const geometry = buildPibLineGeometry({
      width: 340,
      serie: SERIE,
      selectedIndex: 13,
    });

    expect(geometry.narrow).toBe(true);
    expect(geometry.height).toBe(300);
    expect(geometry.margin.left).toBe(56);
    expect(
      geometry.years.filter((year) => year.show).map((year) => year.year),
    ).toEqual([2011, 2015, 2019, 2023]);
  });

  it("never draws narrower than 300 px and centres a single year", () => {
    const geometry = buildPibLineGeometry({
      width: 120,
      serie: [SERIE[0]],
      selectedIndex: 0,
    });

    expect(geometry.width).toBe(300);
    expect(geometry.years[0].x).toBe(56 + (300 - 56 - 52) / 2);
  });

  it("rejects a selected index outside the series", () => {
    expect(() =>
      buildPibLineGeometry({ width: 820, serie: SERIE, selectedIndex: 14 }),
    ).toThrow("selectedIndex 14 for a series of 14 years");
  });
});
