import type { Feature, FeatureCollection, Polygon } from "geojson";
import { textWidth } from "@/features/panels/mapPosterText";
import { describe, expect, it } from "vitest";
import {
  bboxOf,
  buildInsetSvg,
  makeProjector,
  ringPath,
} from "@/features/panels/mapPosterInset";

const square = (
  west: number,
  south: number,
  east: number,
  north: number,
): Feature<Polygon> => ({
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south],
      ],
    ],
  },
});

const collection = (...features: Feature[]): FeatureCollection => ({
  type: "FeatureCollection",
  features,
});

const BOX = { x: 10, y: 20, width: 80, height: 60 };

describe("bboxOf", () => {
  it("covers every polygon and multipolygon of the collection", () => {
    const multi: Feature = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [10, 10],
              [11, 10],
              [11, 11],
              [10, 10],
            ],
          ],
          [
            [
              [20, 30],
              [21, 30],
              [21, 31],
              [20, 30],
            ],
          ],
        ],
      },
    };

    expect(bboxOf(collection(square(0, 0, 2, 2), multi))).toEqual([
      0, 0, 21, 31,
    ]);
  });

  it("is null for an empty collection", () => {
    expect(bboxOf(collection())).toBeNull();
  });
});

describe("makeProjector", () => {
  it("fits the bounding box inside the box, keeping the aspect", () => {
    const project = makeProjector([-45, -10, -35, 0], BOX, 4);
    const [x1, y1] = project(-45, 0);
    const [x2, y2] = project(-35, -10);

    expect(x1).toBeGreaterThanOrEqual(BOX.x + 4 - 0.01);
    expect(y1).toBeGreaterThanOrEqual(BOX.y + 4 - 0.01);
    expect(x2).toBeLessThanOrEqual(BOX.x + BOX.width - 4 + 0.01);
    expect(y2).toBeLessThanOrEqual(BOX.y + BOX.height - 4 + 0.01);
  });

  it("puts north above south", () => {
    const project = makeProjector([-45, -10, -35, 0], BOX, 4);

    expect(project(-40, 0)[1]).toBeLessThan(project(-40, -10)[1]);
  });
});

describe("ringPath", () => {
  const project = (lon: number, lat: number): [number, number] => [lon, -lat];

  it("draws a closed path", () => {
    const path = ringPath(
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 0],
      ],
      project,
    );

    expect(path.startsWith("M0 0")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
  });

  it("drops points that are almost on top of the previous one", () => {
    const ring: [number, number][] = [[0, 0]];

    for (let i = 1; i <= 50; i += 1) ring.push([i * 0.01, 0]);
    ring.push([20, 0], [20, 10], [0, 0]);

    expect(ringPath(ring, project).split("L").length).toBeLessThan(10);
  });
});

// O quadro real do cartaz (INSET em mapPoster.ts) é mais estreito que o BOX.
const POSTER_BOX = { ...BOX, width: 68 };

describe("buildInsetSvg", () => {
  const inset = {
    label: "Recorte: Nordeste",
    context: collection(square(-45, -10, -35, 0), square(100, 50, 110, 60)),
    highlight: collection(square(-44, -9, -36, -1)),
  };

  it("draws the highlight in the accent color and the label", () => {
    const svg = buildInsetSvg(inset, "#e5640f", BOX, "t");

    expect(svg).toContain('fill="#e5640f"');
    expect(svg).toContain("Recorte: Nordeste");
  });

  it("skips context features that fall outside the box", () => {
    const svg = buildInsetSvg(inset, "#e5640f", BOX, "t");

    expect(svg.match(/data-ctx/g)).toHaveLength(1);
  });

  it("escapes the label", () => {
    const svg = buildInsetSvg(
      { ...inset, label: "A & <B>" },
      "#e5640f",
      BOX,
      "t",
    );

    expect(svg).toContain("A &amp; &lt;B&gt;");
  });

  it("keeps the normal size for a label that fits", () => {
    const svg = buildInsetSvg(inset, "#e5640f", BOX, "t");

    expect(svg).toContain('font-size="6.5"');
  });

  it("shrinks a long label to fit the frame", () => {
    const label = "Recorte: Pernambuco";
    const svg = buildInsetSvg({ ...inset, label }, "#e5640f", POSTER_BOX, "t");
    const size = Number(/font-size="([\d.]+)"/.exec(svg)?.[1]);

    expect(size).toBeLessThan(6.5);
    expect(textWidth(label, size, 700)).toBeLessThanOrEqual(
      POSTER_BOX.width - 8,
    );
  });

  it("truncates a label that does not fit even at the smallest size", () => {
    const label = "Recorte: Rio Grande do Norte e Paraíba";
    const svg = buildInsetSvg({ ...inset, label }, "#e5640f", POSTER_BOX, "t");

    expect(svg).toContain("…");
    expect(svg).not.toContain(label);
  });

  it("is empty when there is nothing to highlight", () => {
    expect(
      buildInsetSvg({ ...inset, highlight: collection() }, "#e5640f", BOX, "t"),
    ).toBe("");
  });
});
