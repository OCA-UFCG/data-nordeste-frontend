import { describe, expect, it } from "vitest";
import {
  MIN_CONTRAST_LARGE_TEXT,
  MIN_CONTRAST_NORMAL_TEXT,
  darkenForWhiteBackground,
  getContrastRatio,
  getReadableTextColor,
} from "./contrast";

describe("getContrastRatio", () => {
  it("matches the WCAG extremes", () => {
    expect(getContrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(getContrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });

  it("returns null for colors that are not 6-digit hex", () => {
    expect(getContrastRatio("red", "#ffffff")).toBeNull();
  });
});

describe("getReadableTextColor", () => {
  it("keeps white on dark enough backgrounds", () => {
    expect(getReadableTextColor("#017f35")).toBe("#ffffff");
  });

  // Regression: macrotheme colors from the CMS (pink, orange) put white tag
  // text under 4.5:1 in the catalog and macrotheme banner.
  it.each(["#d65384", "#f79339", "#97b42e", "#e5333f"])(
    "switches to dark text on %s",
    (background) => {
      const text = getReadableTextColor(background);

      expect(text).not.toBe("#ffffff");
      expect(getContrastRatio(background, text)).toBeGreaterThanOrEqual(
        MIN_CONTRAST_NORMAL_TEXT,
      );
    },
  );

  it("keeps white when the color cannot be parsed", () => {
    expect(getReadableTextColor("")).toBe("#ffffff");
  });
});

describe("darkenForWhiteBackground", () => {
  it("leaves colors that already pass untouched", () => {
    expect(darkenForWhiteBackground("#017f35")).toBe("#017f35");
  });

  it("darkens a light color until it reaches the ratio", () => {
    const darkened = darkenForWhiteBackground(
      "#35b2db",
      MIN_CONTRAST_LARGE_TEXT,
    );

    expect(darkened).not.toBe("#35b2db");
    expect(getContrastRatio(darkened, "#ffffff")).toBeGreaterThanOrEqual(
      MIN_CONTRAST_LARGE_TEXT,
    );
  });

  it("returns unparseable colors unchanged", () => {
    expect(darkenForWhiteBackground("var(--x)")).toBe("var(--x)");
  });
});
