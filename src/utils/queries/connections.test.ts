import { describe, expect, it } from "vitest";
import { CONNECTIONS_PAGE_QUERY } from "./connections";

describe("CONNECTIONS_PAGE_QUERY", () => {
  it("requests every page-header field rendered by the connections hero", () => {
    expect(CONNECTIONS_PAGE_QUERY).toMatch(
      /pageHeadersCollection[\s\S]*richSubtitle\s*{\s*json\s*}/,
    );
    expect(CONNECTIONS_PAGE_QUERY).toMatch(
      /pageHeadersCollection[\s\S]*banner\s*{\s*url\s*}/,
    );
  });
});
