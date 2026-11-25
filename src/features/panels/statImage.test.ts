import { describe, expect, it } from "vitest";
import { buildStatImage } from "@/features/panels/statImage";

describe("buildStatImage", () => {
  it("draws value, caption and the variation pill like the card", () => {
    const image = buildStatImage({
      value: "54,6 mi",
      caption: "em 2022",
      pill: { text: "+3,2% desde 2010", direction: "up" },
    });

    expect(image.svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    expect(image.svg).toContain(">54,6 mi</text>");
    expect(image.svg).toContain(">em 2022</text>");
    expect(image.svg).toContain(">+3,2% desde 2010</text>");
    expect(image.svg).toContain('fill="#e3f7ea"');
    expect(image.height).toBe(82);
  });

  it("turns the arrow down and uses the red pill for a fall", () => {
    const { svg } = buildStatImage({
      value: "1,2",
      pill: { text: "-0,4", direction: "down" },
    });

    expect(svg).toContain("rotate(90 12 12)");
    expect(svg).toContain('fill="#ffe1e3"');
  });

  it("draws no arrow when the number did not change", () => {
    const { svg } = buildStatImage({
      value: "1,2",
      pill: { text: "0,0", direction: "flat" },
    });

    expect(svg).not.toContain("<path");
  });

  it("shows the dash and 'sem dado neste ano' without a value, and drops the pill", () => {
    const { svg, height } = buildStatImage({
      value: null,
      caption: "em 2022",
      pill: { text: "+1%", direction: "up" },
    });

    expect(svg).toContain(">—</text>");
    expect(svg).toContain(">sem dado neste ano</text>");
    expect(svg).not.toContain("em 2022");
    expect(svg).not.toContain("<rect");
    expect(height).toBe(58);
  });

  it("escapes the text and widens for long values", () => {
    const { svg, width } = buildStatImage({ value: "R$ 1.234.567,89 <bi>" });

    expect(svg).toContain("R$ 1.234.567,89 &lt;bi&gt;");
    expect(width).toBeGreaterThan(320);
  });

  it("keeps a minimum width so the downloaded title fits", () => {
    expect(buildStatImage({ value: "7" }).width).toBe(320);
  });
});
