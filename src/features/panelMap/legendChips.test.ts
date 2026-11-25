import type { Feature, FeatureCollection } from "geojson";
import { describe, expect, it } from "vitest";
import type { GeodataStyles } from "@/features/panelMap/geodataTypes";
import { legendChips } from "@/features/panelMap/legendChips";

const OUTLINE = { color: "#666", widthPx: 0.5 };
const CLASSES = [
  { lower: 0, upper: 10, label: "Pequeno", color: "#aaa" },
  { lower: 10, upper: 100, label: "Grande", color: "#bbb" },
];

const STYLES: GeodataStyles = {
  indicators: {
    pib: { attribute: "pib", classes: CLASSES, outline: OUTLINE },
    demografia: { attribute: "pop", classes: CLASSES, outline: OUTLINE },
    idh: { attribute: "idh", classes: CLASSES, outline: OUTLINE },
  },
  stateOutline: OUTLINE,
  aridez: [{ value: 2, color: "#d7191b", label: "Árido" }],
};

const city = (code: string, value: number | null, nordeste = 1): Feature => ({
  type: "Feature",
  properties: { code, uf: "PE", nordeste, v2021: value },
  geometry: { type: "Point", coordinates: [0, 0] },
});

const FEATURES: FeatureCollection = {
  type: "FeatureCollection",
  features: [city("1", 5), city("2", 50), city("3", 60), city("4", 5, 0)],
};

describe("legendChips", () => {
  it("counts the area features in each class of the year", () => {
    const chips = legendChips({
      styles: STYLES,
      features: FEATURES,
      indicator: "pib",
      area: "nordeste",
      ano: 2021,
    });

    expect(chips).toEqual([
      { label: "Pequeno", color: "#aaa", count: 1 },
      { label: "Grande", color: "#bbb", count: 2 },
    ]);
  });

  it("returns the aridez palette, with counts only when they are given", () => {
    const inputs = {
      styles: STYLES,
      features: FEATURES,
      indicator: "aridez",
      area: "nordeste",
      ano: 2020,
    } as const;

    expect(legendChips(inputs)).toEqual([{ label: "Árido", color: "#d7191b" }]);
    expect(legendChips({ ...inputs, classCounts: new Map([[2, 7]]) })).toEqual([
      { label: "Árido", color: "#d7191b", count: 7 },
    ]);
  });
});
