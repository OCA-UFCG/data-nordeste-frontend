import { describe, expect, it } from "vitest";
import {
  addArcGisEmbedQueryIfMissing,
  buildExperienceSource,
  buildStoryMapSource,
  getArcGisInternalEmbedHref,
  isValidArcGisId,
} from "./arcgis";

const VALID_ID = "0123456789abcdef0123456789abcdef";

describe("ArcGIS embed helpers", () => {
  it("validates public ArcGIS route ids", () => {
    expect(isValidArcGisId(VALID_ID)).toBe(true);
    expect(isValidArcGisId("not-a-valid-id")).toBe(false);
  });

  it("builds public embed sources from ids", () => {
    expect(buildStoryMapSource(VALID_ID)).toBe(
      `https://storymaps.arcgis.com/stories/${VALID_ID}`,
    );
    expect(buildExperienceSource(VALID_ID)).toBe(
      `https://experience.arcgis.com/experience/${VALID_ID}`,
    );
  });

  it("adds embed=true only to supported ArcGIS URLs", () => {
    const source = `https://storymaps.arcgis.com/stories/${VALID_ID}`;

    expect(addArcGisEmbedQueryIfMissing(source)).toBe(`${source}?embed=true`);
    expect(addArcGisEmbedQueryIfMissing("not a url")).toBe("not a url");
  });

  it("maps external ArcGIS links to internal routes", () => {
    expect(
      getArcGisInternalEmbedHref(
        `https://experience.arcgis.com/experience/${VALID_ID}?embed=true`,
      ),
    ).toBe(`/experience/${VALID_ID}`);
  });
});
