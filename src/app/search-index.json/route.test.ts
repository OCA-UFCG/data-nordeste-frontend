import { describe, expect, it, vi } from "vitest";
import { getContent } from "@/utils/contentful";

vi.mock("@/utils/contentful", () => ({
  getContent: vi.fn(),
}));

describe("/search-index.json route", () => {
  it("returns the generated search index as public JSON", async () => {
    vi.mocked(getContent).mockResolvedValue({
      postCollection: {
        items: [
          {
            sys: { id: "post-1" },
            title: "PIB",
            type: "data-panel",
            link: "/data-panel/pib",
            categoryCollection: { items: [] },
          },
        ],
      },
      panelsCollection: { items: [] },
      dataStoriesCollection: { items: [] },
      themeCollection: { items: [] },
    });
    const { GET } = await import("./route");

    const response = await GET();
    const body = await response.json();

    expect(response.headers.get("Cache-Control")).toContain("s-maxage");
    expect(body).toEqual(
      expect.objectContaining({
        version: 2,
        items: [
          expect.objectContaining({
            id: "post:post-1",
            href: "/data-panel/pib",
          }),
        ],
      }),
    );
  });
});
