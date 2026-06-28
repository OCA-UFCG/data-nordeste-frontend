import { describe, expect, it } from "vitest";
import { FILTERS_QUERY } from "./catalog";

describe("FILTERS_QUERY", () => {
  it("requests the catalog page-header banner URL", () => {
    expect(FILTERS_QUERY).toMatch(
      /pageHeadersCollection[\s\S]*banner\s*{\s*url\s*}/,
    );
  });
});
