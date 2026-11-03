import { describe, expect, it } from "vitest";
import { getBucket, rankRegions } from "@/features/panels/choropleth";
import { PIB_MAP_BUCKETS } from "@/features/panels/pib/pibPanel";

describe("getBucket", () => {
  it("uses the upper bound of each class as exclusive", () => {
    expect(getBucket(PIB_MAP_BUCKETS, 499_999_999).label).toBe("< 500 Mi");
    expect(getBucket(PIB_MAP_BUCKETS, 500_000_000).label).toBe("500 Mi - 1 Bi");
    expect(getBucket(PIB_MAP_BUCKETS, 12e9).label).toBe("10 Bi - 20 Bi");
    expect(getBucket(PIB_MAP_BUCKETS, 90e9).label).toBe("> 35 Bi");
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
