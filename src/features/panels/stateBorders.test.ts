import { describe, expect, it } from "vitest";
import type { MapFeature } from "@/features/panels/mapFraming";
import { getStateBorders } from "@/features/panels/stateBorders";

const square = (
  name: string,
  uf: string,
  [lon, lat]: [number, number],
): MapFeature => ({
  properties: { name, uf },
  geometry: {
    coordinates: [
      [
        [lon, lat],
        [lon + 1, lat],
        [lon + 1, lat - 1],
        [lon, lat - 1],
        [lon, lat],
      ],
    ],
  },
});

const asMultiPolygon = (feature: MapFeature): MapFeature => ({
  ...feature,
  geometry: { coordinates: [feature.geometry.coordinates] },
});

const sharedEdge = [
  [1, 0],
  [1, -1],
];

const hasSegment = (borders: number[][][], segment: number[][]) =>
  borders.some(
    ([a, b]) =>
      (a.join() === segment[0].join() && b.join() === segment[1].join()) ||
      (a.join() === segment[1].join() && b.join() === segment[0].join()),
  );

describe("getStateBorders", () => {
  it("keeps the outline and drops edges between municipalities of one state", () => {
    const borders = getStateBorders([
      square("2600001", "PE", [0, 0]),
      square("2600002", "PE", [1, 0]),
    ]);

    expect(borders).toHaveLength(6);
    expect(hasSegment(borders, sharedEdge)).toBe(false);
  });

  it("keeps the edge between two states", () => {
    const borders = getStateBorders([
      square("2600001", "PE", [0, 0]),
      asMultiPolygon(square("2700001", "AL", [1, 0])),
    ]);

    expect(borders).toHaveLength(7);
    expect(hasSegment(borders, sharedEdge)).toBe(true);
  });
});
