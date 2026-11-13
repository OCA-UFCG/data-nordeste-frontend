import { describe, expect, it } from "vitest";
import {
  getBucket,
  rankRegions,
  type ChoroplethBucket,
} from "@/features/panels/choropleth";

// Faixas de PIB por município, só para o teste.
const BUCKETS: readonly ChoroplethBucket[] = [
  { max: 5e8, label: "< 500 Mi", color: "#fff7ed" },
  { max: 1e9, label: "500 Mi - 1 Bi", color: "#fcd9ac" },
  { max: 2e10, label: "10 Bi - 20 Bi", color: "#be4610" },
  { max: Infinity, label: "> 35 Bi", color: "#421608" },
];

describe("getBucket", () => {
  it("uses the upper bound of each class as exclusive", () => {
    expect(getBucket(BUCKETS, 499_999_999).label).toBe("< 500 Mi");
    expect(getBucket(BUCKETS, 500_000_000).label).toBe("500 Mi - 1 Bi");
    expect(getBucket(BUCKETS, 12e9).label).toBe("10 Bi - 20 Bi");
    expect(getBucket(BUCKETS, 90e9).label).toBe("> 35 Bi");
  });
});

describe("rankRegions", () => {
  it("ranks from the largest value and shares the position on ties", () => {
    const ranks = rankRegions([
      { code: "a", value: 5 },
      { code: "b", value: 9 },
      { code: "c", value: 5 },
      { code: "d", value: 1 },
    ]);

    expect([...ranks.entries()]).toEqual([
      ["b", 1],
      ["a", 2],
      ["c", 2],
      ["d", 4],
    ]);
  });
});
