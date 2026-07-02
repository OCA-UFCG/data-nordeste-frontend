import { describe, expect, it } from "vitest";
import { ABOUT_PAGE_QUERY } from "./about";

describe("ABOUT_PAGE_QUERY", () => {
  it("requests every page-header field rendered by the about hero", () => {
    expect(ABOUT_PAGE_QUERY).toMatch(
      /pageHeadersCollection[\s\S]*richSubtitle\s*{\s*json\s*}/,
    );
    expect(ABOUT_PAGE_QUERY).toMatch(
      /pageHeadersCollection[\s\S]*banner\s*{\s*url\s*}/,
    );
  });
});
