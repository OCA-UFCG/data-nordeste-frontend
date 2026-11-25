import { describe, expect, it } from "vitest";

import {
  describeMapFeature,
  featureValueReader,
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

const format = {
  valueLabel: "PIB",
  formatValue: (value: number) => `R$ ${value}`,
};
const byYear = featureValueReader(2023);

describe("rankWithinArea", () => {
  it("ignores features without a number", () => {
    const ranks = rankWithinArea(
      [feature("a", 5), feature("b", null), feature("c", 9)],
      byYear,
    );

    expect([...ranks]).toEqual([
      ["c", 1],
      ["a", 2],
    ]);
  });

  it("ignores features without the year", () => {
    const ranks = rankWithinArea(
      [feature("a", 5), feature("b", 1)],
      featureValueReader(2020),
    );

    expect(ranks.size).toBe(0);
  });

  it("ties like rankRegions", () => {
    const ranks = rankWithinArea(
      [feature("a", 9), feature("b", 9), feature("c", 1)],
      byYear,
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
      byYear,
      new Map(),
      10,
      format,
    );

    expect(result).toMatchObject({ value: "PIB: sem dado", rank: null });
  });

  it("shows no data when the year is missing", () => {
    const missing: MapFeatureProps = { code: "a", name: "X", uf: "PE" };

    expect(
      describeMapFeature(missing, byYear, new Map(), 10, format).value,
    ).toBe("PIB: sem dado");
  });

  it("formats the value and the rank with the area total", () => {
    const ranks = new Map([["a", 12]]);
    const result = describeMapFeature(
      feature("a", 50),
      byYear,
      ranks,
      1794,
      format,
    );

    expect(result).toEqual({
      title: "Cidade a (PE)",
      details: [],
      value: "PIB: R$ 50",
      rank: "12º de 1.794",
    });
  });

  it("has no rank when the feature is outside the ranked area", () => {
    const result = describeMapFeature(
      feature("a", 50),
      byYear,
      new Map(),
      9,
      format,
    );

    expect(result.rank).toBeNull();
  });

  it("keeps a name that already carries the UF", () => {
    const state = feature("PE", 0.7, { name: "Pernambuco (PE)" });

    expect(describeMapFeature(state, byYear, new Map(), 9, format).title).toBe(
      "Pernambuco (PE)",
    );
  });
});

describe("featureValueReader", () => {
  it("lê o v<ano> do GeoJSON sem valores do painel", () => {
    expect(featureValueReader(2023)(feature("a", 7))).toBe(7);
  });

  it("com valores do painel, lê pelo code e ignora o GeoJSON", () => {
    const read = featureValueReader(2023, new Map([["a", 42]]));

    expect(read(feature("a", 7))).toBe(42);
    expect(read(feature("b", 7))).toBeNull();
  });

  it("ranqueia e descreve pelos valores do painel", () => {
    const read = featureValueReader(
      2021,
      new Map([
        ["a", 80],
        ["b", 95],
      ]),
    );
    const ranks = rankWithinArea(
      [feature("a", null), feature("b", null)],
      read,
    );
    const text = describeMapFeature(feature("a", null), read, ranks, 2, format);

    expect(text).toMatchObject({ value: "PIB: R$ 80", rank: "2º de 2" });
    expect(
      describeMapFeature(feature("c", 1), read, ranks, 2, format),
    ).toMatchObject({ value: "PIB: sem dado", rank: null });
  });
});
