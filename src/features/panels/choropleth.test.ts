import { describe, expect, it } from "vitest";
import { getBucket } from "@/features/panels/choropleth";
import { PIB_MAP_BUCKETS } from "@/features/panels/pib/pibPanel";

describe("getBucket", () => {
  it("uses the upper bound of each class as exclusive", () => {
    expect(getBucket(PIB_MAP_BUCKETS, 499_999_999).label).toBe("Até R$ 500 mi");
    expect(getBucket(PIB_MAP_BUCKETS, 500_000_000).label).toBe(
      "R$ 500 mi a 1 bi",
    );
    expect(getBucket(PIB_MAP_BUCKETS, 12e9).label).toBe("R$ 10 a 20 bi");
    expect(getBucket(PIB_MAP_BUCKETS, 90e9).label).toBe("Acima de R$ 35 bi");
  });
});
