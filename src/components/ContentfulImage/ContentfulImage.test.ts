import { describe, expect, it } from "vitest";
import { shouldBypassContentfulImageOptimization } from "./ContentfulImage";

describe("shouldBypassContentfulImageOptimization", () => {
  it("bypasses the Next optimizer only for the Contentful cache proxy", () => {
    expect(
      shouldBypassContentfulImageOptimization(
        "/contentful-assets/space/asset/banner.png",
      ),
    ).toBe(true);
    expect(
      shouldBypassContentfulImageOptimization("https://drive.google.com/image"),
    ).toBe(false);
  });
});
