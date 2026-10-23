import { describe, expect, it } from "vitest";
import {
  getAspectScale,
  getMapAspectRatio,
  getMapFocus,
  getMunicipalityFocusBounds,
  getMapBounds,
  mapNameFor,
  MAX_MAP_ZOOM,
  selectMapFeatures,
  type MapBounds,
  type MapFeature,
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

describe("getMunicipalityFocusBounds", () => {
  it("centres a square frame on the municipality with room for neighbours", () => {
    const bounds = getMunicipalityFocusBounds(FEATURES, "2927408");

    if (!bounds) throw new Error("Expected bounds for 2927408, got undefined.");
    const [[west, north], [east, south]] = bounds;

    expect((west + east) / 2).toBeCloseTo(-38.5);
    expect((north + south) / 2).toBeCloseTo(-12.5);
    expect(north - south).toBeCloseTo(3);
    expect(getMapAspectRatio(bounds)).toBeCloseTo(1, 1);
  });

  it("returns undefined for a municipality outside the mesh", () => {
    expect(getMunicipalityFocusBounds(FEATURES, "0000000")).toBeUndefined();
  });
});

describe("getMapFocus", () => {
  const AREA: MapBounds = [
    [-46, -3],
    [-35, -18],
  ];

  it("zooms in over the whole area so zoom-out can return to it", () => {
    const focus = getMapFocus(AREA, [
      [-40, -10],
      [-39, -11],
    ]);

    expect(focus.center).toEqual([-39.5, -10.5]);
    expect(focus.zoom).toBe(11);
  });

  it("shows the whole area when the focus is as large as it", () => {
    const focus = getMapFocus(AREA, [
      [-50, -10],
      [-30, -30],
    ]);

    expect(focus).toEqual({ center: [-40.5, -10.5], zoom: 1 });
  });

  it("pulls a focus at the edge back so the view stays inside the area", () => {
    const focus = getMapFocus(AREA, [
      [-35.5, -17.5],
      [-34.5, -18.5],
    ]);
    const [lon, lat] = focus.center;

    expect(focus.zoom).toBe(11);
    expect(lon).toBeCloseTo(-35 - 11 / 22);
    expect(lat).toBeCloseTo(-18 + 15 / 22);
  });

  it("keeps the zoom between the whole area and the zoom limit", () => {
    expect(getMapFocus(AREA, AREA).zoom).toBe(1);
    expect(
      getMapFocus(AREA, [
        [-40, -10],
        [-39.99, -10.01],
      ]).zoom,
    ).toBe(MAX_MAP_ZOOM);
  });
});
