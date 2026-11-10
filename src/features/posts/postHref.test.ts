import { describe, expect, it } from "vitest";
import { resolvePostHref } from "./postHref";

const STORY_ID = "0123456789abcdef0123456789abcdef";

describe("resolvePostHref", () => {
  it("opens a newsletter in the local PDF viewer", () => {
    expect(
      resolvePostHref({ type: "newsletter", link: "", sys: { id: "abc" } }),
    ).toEqual({ href: "/boletim/abc", openInNewTab: false });
  });

  it("keeps an ArcGIS story inside the portal", () => {
    expect(
      resolvePostHref({
        type: "data-story",
        link: `https://storymaps.arcgis.com/stories/${STORY_ID}`,
        sys: { id: "story" },
      }),
    ).toEqual({ href: `/data-stories/${STORY_ID}`, openInNewTab: false });
  });

  it("opens any other link in a new tab", () => {
    expect(
      resolvePostHref({
        type: "data-panel",
        link: "https://app.powerbi.com/view?r=x",
        sys: { id: "panel" },
      }),
    ).toEqual({ href: "https://app.powerbi.com/view?r=x", openInNewTab: true });
  });

  // Regression: a Contentful draft saved without link broke the build of "/".
  it("has no destination when the entry has no link", () => {
    const draftWithoutLink: Parameters<typeof resolvePostHref>[0] = {
      type: "data-panel",
      link: null,
      sys: { id: "3O7Ylnbn2nk0myHMqMAGIX" },
    };

    expect(resolvePostHref(draftWithoutLink)).toBeNull();
  });
});
