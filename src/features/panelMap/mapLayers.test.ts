import { describe, expect, it } from "vitest";
import type { Feature, FeatureCollection, Polygon } from "geojson";

import {
  areaFilter,
  bboxOf,
  fitTargetFor,
  selectionFilter,
  stateMunicipalLinesFilter,
  veilFilters,
} from "@/features/panelMap/mapLayers";
import { EMPTY_RECORTE } from "@/features/panelMap/mapRecorte";

const square = (
  west: number,
  south: number,
  east: number,
  north: number,
  properties: Record<string, string>,
): Feature<Polygon> => ({
  type: "Feature",
  properties,
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

const collection = (features: Feature[]): FeatureCollection => ({
  type: "FeatureCollection",
  features,
});

const sources = {
  features: collection([
    square(0, 0, 1, 1, { code: "2611606", uf: "PE" }),
    square(5, 5, 6, 6, { code: "2507507", uf: "PB" }),
  ]),
  states: collection([
    square(0, 0, 2, 2, { code: "PE" }),
    square(4, 4, 8, 8, { code: "PB" }),
    square(20, 20, 30, 30, { code: "BA" }),
  ]),
  areas: collection([
    square(-10, -10, 40, 40, { area: "nordeste" }),
    square(1, 1, 3, 3, { area: "semiarido" }),
  ]),
};

describe("areaFilter", () => {
  it("filters features by the area flag", () => {
    expect(areaFilter("semiarido")).toEqual(["==", ["get", "semiarido"], 1]);
  });
});

describe("veilFilters", () => {
  it("has no veil at area level", () => {
    expect(veilFilters(EMPTY_RECORTE, "semiarido")).toEqual({
      states: null,
      selectedStates: null,
      features: null,
    });
  });

  it("veils the states outside the selection at state level", () => {
    expect(veilFilters({ uf: ["PE"], mun: [] }, "semiarido")).toEqual({
      states: ["!", ["in", ["get", "code"], ["literal", ["PE"]]]],
      selectedStates: ["in", ["get", "code"], ["literal", ["PE"]]],
      features: null,
    });
  });

  it("veils the states outside the union of several states", () => {
    expect(
      veilFilters({ uf: ["PE", "PB"], mun: [] }, "semiarido").states,
    ).toEqual(["!", ["in", ["get", "code"], ["literal", ["PE", "PB"]]]]);
  });

  it("veils only the area municipalities of the state at municipality level", () => {
    expect(veilFilters({ uf: ["PE"], mun: ["2611606"] }, "semiarido")).toEqual({
      states: ["!", ["in", ["get", "code"], ["literal", ["PE"]]]],
      selectedStates: ["in", ["get", "code"], ["literal", ["PE"]]],
      features: [
        "all",
        ["==", ["get", "semiarido"], 1],
        ["in", ["get", "uf"], ["literal", ["PE"]]],
        ["!", ["in", ["get", "code"], ["literal", ["2611606"]]]],
      ],
    });
  });
});

describe("stateMunicipalLinesFilter", () => {
  it("is null without a selected state", () => {
    expect(
      stateMunicipalLinesFilter(EMPTY_RECORTE, "nordeste", "municipio"),
    ).toBeNull();
  });

  it("matches the area municipalities of the selected states", () => {
    expect(
      stateMunicipalLinesFilter(
        { uf: ["PE"], mun: [] },
        "semiarido",
        "municipio",
      ),
    ).toEqual([
      "all",
      ["==", ["get", "semiarido"], 1],
      ["in", ["get", "uf"], ["literal", ["PE"]]],
    ]);
  });

  it("is null when the features are states (IDH)", () => {
    expect(
      stateMunicipalLinesFilter({ uf: ["PE"], mun: [] }, "nordeste", "estado"),
    ).toBeNull();
  });
});

describe("selectionFilter", () => {
  it("is null without selection", () => {
    expect(selectionFilter(EMPTY_RECORTE, "municipio")).toBeNull();
  });

  it("outlines the selected municipalities first", () => {
    expect(
      selectionFilter({ uf: ["PE"], mun: ["2611606"] }, "municipio"),
    ).toEqual(["in", ["get", "code"], ["literal", ["2611606"]]]);
  });

  it("outlines the selected states when there is no municipality", () => {
    expect(selectionFilter({ uf: ["PE", "PB"], mun: [] }, "estado")).toEqual([
      "in",
      ["get", "code"],
      ["literal", ["PE", "PB"]],
    ]);
  });

  it("ignores municipalities when the features are states (IDH, Estados)", () => {
    expect(selectionFilter({ uf: ["PE"], mun: ["2611606"] }, "estado")).toEqual(
      ["in", ["get", "code"], ["literal", ["PE"]]],
    );
  });
});

describe("bboxOf", () => {
  it("returns null without features", () => {
    expect(bboxOf([])).toBeNull();
  });

  it("covers polygons and multipolygons", () => {
    const multi: Feature = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [10, 10],
              [12, 10],
              [12, 13],
              [10, 10],
            ],
          ],
        ],
      },
    };

    expect(bboxOf([sources.states.features[0], multi])).toEqual([
      [0, 0],
      [12, 13],
    ]);
  });

  it("rejects geometries other than polygons", () => {
    const point: Feature = {
      type: "Feature",
      properties: {},
      geometry: { type: "Point", coordinates: [1, 2] },
    };

    expect(() => bboxOf([point])).toThrow(/Point/);
  });
});

describe("fitTargetFor", () => {
  it("fits the selected municipalities", () => {
    const target = fitTargetFor(
      { uf: ["PE"], mun: ["2611606"] },
      "nordeste",
      sources,
    );

    expect(target).toEqual([
      [0, 0],
      [1, 1],
    ]);
  });

  it("covers both states when two are selected", () => {
    const target = fitTargetFor(
      { uf: ["PE", "PB"], mun: [] },
      "nordeste",
      sources,
    );

    expect(target).toEqual([
      [0, 0],
      [8, 8],
    ]);
  });

  it("fits the area without selection", () => {
    expect(fitTargetFor(EMPTY_RECORTE, "semiarido", sources)).toEqual([
      [1, 1],
      [3, 3],
    ]);
  });

  it("fits only the part of the state inside the area when it has it", () => {
    const areaStates = collection([square(1, 1, 2, 2, { code: "PE" })]);
    const target = fitTargetFor({ uf: ["PE"], mun: [] }, "semiarido", {
      ...sources,
      areaStates,
    });

    expect(target).toEqual([
      [1, 1],
      [2, 2],
    ]);
  });

  it("falls back to the full state when the area has none of it", () => {
    const areaStates = collection([square(1, 1, 2, 2, { code: "PE" })]);
    const target = fitTargetFor({ uf: ["BA"], mun: [] }, "semiarido", {
      ...sources,
      areaStates,
    });

    expect(target).toEqual([
      [20, 20],
      [30, 30],
    ]);
  });

  it("is null when the area is not in the areas source", () => {
    expect(fitTargetFor(EMPTY_RECORTE, "caatinga", sources)).toBeNull();
  });
});
