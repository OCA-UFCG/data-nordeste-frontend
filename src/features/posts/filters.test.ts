import { describe, expect, it } from "vitest";
import { parsePostsFilters } from "./filters";

describe("posts filters", () => {
  it("builds Contentful filters and URL params without navigating", () => {
    const parsed = parsePostsFilters({
      type_in: ["newsletter", "additional-content"],
      category: ["theme-a"],
      date_gte: new Date("2024-01-01T00:00:00.000Z"),
      date_lte: undefined,
    });

    expect(parsed.urlParams).toEqual({
      type_in: "newsletter,additional-content",
      category: "theme-a",
      date_gte: "2024-01-01T00:00:00.000Z",
    });
    expect(parsed.contentfulFilter).toEqual({
      type_in: ["newsletter", "additional-content"],
      category: {
        sys: {
          id_in: ["theme-a"],
        },
      },
      date_gte: "2024-01-01T00:00:00.000Z",
    });
  });
});
