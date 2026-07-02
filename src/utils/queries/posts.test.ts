import { describe, expect, it } from "vitest";
import { POST_PAGE_QUERY } from "./posts";

describe("POST_PAGE_QUERY", () => {
  it("requests every page-header field rendered by the posts hero", () => {
    expect(POST_PAGE_QUERY).toMatch(
      /pageHeadersCollection[\s\S]*richSubtitle\s*{\s*json\s*}/,
    );
    expect(POST_PAGE_QUERY).toMatch(
      /pageHeadersCollection[\s\S]*banner\s*{\s*url\s*}/,
    );
  });
});
