import { describe, expect, it } from "vitest";

import {
  describeMapFeature,
  rankWithinArea,
} from "@/features/panelMap/mapTooltip";
import type { MapFeatureProps } from "@/features/panelMap/geodataTypes";

const feature = (
  code: string,
  value: number | null,
  overrides: Partial<MapFeatureProps> = {},
): MapFeatureProps => ({
  code,
  name: `Cidade ${code}`,
  uf: "PE",
  v2023: value,
  ...overrides,
});

const format = (value: number) => `R$ ${value}`;

describe("rankWithinArea", () => {
  it("ignores features without a number", () => {
    const ranks = rankWithinArea(
      [feature("a", 5), feature("b", null), feature("c", 9)],
      2023,
    );

    expect([...ranks]).toEqual([
      ["c", 1],
      ["a", 2],
    ]);
  });

  it("ignores features without the year", () => {
    const ranks = rankWithinArea([feature("a", 5), feature("b", 1)], 2020);

    expect(ranks.size).toBe(0);
  });

  it("ties like rankRegions", () => {
    const ranks = rankWithinArea(
      [feature("a", 9), feature("b", 9), feature("c", 1)],
      2023,
    );

    expect(ranks.get("a")).toBe(1);
    expect(ranks.get("b")).toBe(1);
    expect(ranks.get("c")).toBe(3);
  });
});

describe("describeMapFeature", () => {
  it("shows no data and no rank when the value is null", () => {
    const result = describeMapFeature(
      feature("a", null),
      2023,
      new Map(),
      10,
      format,
    );

    expect(result).toMatchObject({ value: "sem dado", rank: null });
  });

  it("shows no data when the year is missing", () => {
    const missing: MapFeatureProps = { code: "a", name: "X", uf: "PE" };

    expect(describeMapFeature(missing, 2023, new Map(), 10, format).value).toBe(
      "sem dado",
    );
  });

  it("formats the value and the rank with the area total", () => {
    const ranks = new Map([["a", 12]]);
    const result = describeMapFeature(
      feature("a", 50),
      2023,
      ranks,
      1794,
      format,
    );

    expect(result).toEqual({
      title: "Cidade a (PE)",
      value: "R$ 50",
      rank: "12º de 1.794",
    });
  });

  it("has no rank when the feature is outside the ranked area", () => {
    const result = describeMapFeature(
      feature("a", 50),
      2023,
      new Map(),
      9,
      format,
    );

    expect(result.rank).toBeNull();
  });

  it("keeps a name that already carries the UF", () => {
    const state = feature("PE", 0.7, { name: "Pernambuco (PE)" });

    expect(describeMapFeature(state, 2023, new Map(), 9, format).title).toBe(
      "Pernambuco (PE)",
    );
  });
});
