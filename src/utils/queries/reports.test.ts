import { describe, expect, it } from "vitest";
import { REPORT_PAGE_QUERY } from "./reports";

describe("REPORT_PAGE_QUERY", () => {
  it("requests the banner image and every rich text rendered on the page", () => {
    expect(REPORT_PAGE_QUERY).toMatch(
      /reportCollection[\s\S]*banner\s*{\s*url\s*}/,
    );
    expect(REPORT_PAGE_QUERY).toMatch(
      /reportCollection[\s\S]*textoDoBanner\s*{\s*json\s*}/,
    );
    expect(REPORT_PAGE_QUERY).toMatch(
      /reportCollection[\s\S]*textoDoMunicipio\s*{\s*json\s*}/,
    );
    expect(REPORT_PAGE_QUERY).toMatch(
      /reportCollection[\s\S]*textoDoTema\s*{\s*json\s*}/,
    );
  });

  it("still loads the macrotheme list used by the builder", () => {
    expect(REPORT_PAGE_QUERY).toMatch(/themeCollection[\s\S]*name/);
    expect(REPORT_PAGE_QUERY).toMatch(/themeCollection[\s\S]*sys\s*{\s*id\s*}/);
  });
});
