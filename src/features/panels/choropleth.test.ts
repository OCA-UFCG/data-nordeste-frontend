import { describe, expect, it } from "vitest";
import { getBucket } from "@/features/panels/choropleth";
import { PIB_MAP_BUCKETS } from "@/features/panels/pib/pibPanel";

describe("getBucket", () => {
  it("uses the upper bound of each class as exclusive", () => {
    expect(getBucket(PIB_MAP_BUCKETS, 499_999_999).label).toBe("< 500 Mi");
    expect(getBucket(PIB_MAP_BUCKETS, 500_000_000).label).toBe("500 Mi - 1 Bi");
    expect(getBucket(PIB_MAP_BUCKETS, 12e9).label).toBe("10 Bi - 20 Bi");
    expect(getBucket(PIB_MAP_BUCKETS, 90e9).label).toBe("> 35 Bi");
  });
});
