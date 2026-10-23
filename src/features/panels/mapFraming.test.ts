import { describe, expect, it } from "vitest";
import {
  getAspectScale,
  getMapAspectRatio,
  getMapFraming,
  getSelectionFocusBounds,
  getMapBounds,
  mapNameFor,
  selectMapFeatures,
  type MapBounds,
  type MapFeature,
  type MapFocus,
  type MapFraming,
} from "@/features/panels/mapFraming";

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
      ],
    ],
  },
});

const FEATURES = [
  square("2611606", "PE", [-35, -8]),
  square("2927408", "BA", [-39, -12]),
  square("2605459", "PE", [-32.5, -3.8]),
];

describe("getMapBounds", () => {
  it("frames the given municipalities except Fernando de Noronha", () => {
    expect(getMapBounds(FEATURES)).toEqual([
      [-39, -8],
      [-34, -13],
    ]);
  });

  it("returns undefined when nothing is selected", () => {
    expect(getMapBounds([])).toBeUndefined();
  });
});

describe("selectMapFeatures", () => {
  it("drops municipalities outside the filter", () => {
    const names = selectMapFeatures(FEATURES, ["2927408"]).map(
      (feature) => feature.properties.name,
    );

    expect(names).toEqual(["2927408"]);
  });
});

describe("mapNameFor", () => {
  it("depends on the set of municipalities, not their order", () => {
    expect(mapNameFor("m", ["1", "2"])).toBe(mapNameFor("m", ["2", "1"]));
    expect(mapNameFor("m", ["1"])).not.toBe(mapNameFor("m", ["2"]));
  });
});

describe("getAspectScale", () => {
  it("uses cos(latitude) at the centre of the frame", () => {
    expect(
      getAspectScale([
        [-48, -1],
        [-35, -20],
      ]),
    ).toBeCloseTo(Math.cos((10.5 * Math.PI) / 180));
  });
});

describe("getMapAspectRatio", () => {
  it("follows the framed region within limits", () => {
    expect(
      getMapAspectRatio([
        [-41.4, -7.3],
        [-34.8, -9.5],
      ]),
    ).toBe(1.6);
    expect(getMapAspectRatio(undefined)).toBe(0.75);
  });
});

describe("getSelectionFocusBounds", () => {
  it("centres a square frame on the municipality with room for neighbours", () => {
    const bounds = getSelectionFocusBounds(FEATURES, ["2927408"]);

    if (!bounds) throw new Error("Expected bounds for 2927408, got undefined.");
    const [[west, north], [east, south]] = bounds;

    expect((west + east) / 2).toBeCloseTo(-38.5);
    expect((north + south) / 2).toBeCloseTo(-12.5);
    expect(north - south).toBeCloseTo(3);
    expect(getMapAspectRatio(bounds)).toBeCloseTo(1, 1);
  });

  it("returns undefined for a municipality outside the mesh", () => {
    expect(getSelectionFocusBounds(FEATURES, ["0000000"])).toBeUndefined();
    expect(getSelectionFocusBounds(FEATURES, [])).toBeUndefined();
  });

  it("frames every selected municipality and ignores codes outside the mesh", () => {
    const bounds = getSelectionFocusBounds(FEATURES, [
      "2611606",
      "2927408",
      "0000000",
    ]);

    if (!bounds) throw new Error("Expected bounds for two municipalities.");
    const [[west, north], [east, south]] = bounds;

    expect((west + east) / 2).toBeCloseTo(-36.5);
    expect((north + south) / 2).toBeCloseTo(-10.5);
    expect(west).toBeLessThan(-39);
    expect(east).toBeGreaterThan(-34);
  });
});

describe("getMapFraming", () => {
  const BOX_RATIO = 0.75;
  const TALL: MapBounds = [
    [-46, -3],
    [-35, -18],
  ];
  const WIDE: MapBounds = [
    [-41, -7],
    [-35, -9],
  ];
  const focusOf = (framing: MapFraming): MapFocus => {
    if (!framing.focus) throw new Error("Expected a focus, got undefined.");

    return framing.focus;
  };

  it("keeps the whole area as the frame and has no focus by default", () => {
    expect(getMapFraming(TALL, BOX_RATIO)).toMatchObject({ bounds: TALL });
    expect(getMapFraming(TALL, BOX_RATIO).focus).toBeUndefined();
  });

  it("shows the whole area when the focus is as large as it", () => {
    const focus = focusOf(
      getMapFraming(TALL, BOX_RATIO, [
        [-50, -5],
        [-30, -25],
      ]),
    );

    expect(focus).toEqual({ center: [-40.5, -10.5], zoom: 1 });
  });

  it("fits the focus against what a wide area shows in the box", () => {
    const focus = focusOf(
      getMapFraming(WIDE, BOX_RATIO, [
        [-38.3, -7.7],
        [-37.7, -8.3],
      ]),
    );

    expect(focus.zoom).toBeCloseTo(10);
    expect(focus.center[0]).toBeCloseTo(-38);
    expect(focus.center[1]).toBeCloseTo(-8);
  });

  it("pulls a focus at the edge back so the view stays inside the area", () => {
    const { zoom, center } = focusOf(
      getMapFraming(TALL, BOX_RATIO, [
        [-35.5, -17.5],
        [-34.5, -18.5],
      ]),
    );

    expect(center[0]).toBeCloseTo(-35.5);
    expect(center[1]).toBeCloseTo(-18 + 15 / (2 * zoom));
  });

  it("does not pull back a focus outside the area, like Fernando de Noronha", () => {
    const focus = focusOf(
      getMapFraming(WIDE, BOX_RATIO, [
        [-32.7, -3.55],
        [-32.1, -4.15],
      ]),
    );

    expect(focus.center[0]).toBeCloseTo(-32.4);
    expect(focus.center[1]).toBeCloseTo(-3.85);
  });

  it("lets a small municipality zoom well past the old 40x cap", () => {
    const framing = getMapFraming(TALL, BOX_RATIO, [
      [-40, -10],
      [-39.99, -10.01],
    ]);

    expect(framing.maxZoom).toBeGreaterThan(40);
    expect(focusOf(framing).zoom).toBe(framing.maxZoom);
  });
});
