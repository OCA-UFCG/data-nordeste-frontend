import { describe, expect, it } from "vitest";
import {
  buildChartSvg,
  chartImageFileName,
  layoutChartImage,
} from "@/features/panels/chartImage";

describe("layoutChartImage", () => {
  it("adds room above the chart for the title and below it for the source", () => {
    const bare = layoutChartImage({ width: 600, height: 300 });
    const framed = layoutChartImage({
      width: 600,
      height: 300,
      title: "Mapa do IDH por estado",
      source: "Fonte: PNAD",
    });

    expect(bare).toMatchObject({ width: 648, height: 348, chartY: 24 });
    expect(framed.chartY).toBeGreaterThan(bare.chartY);
    expect(framed.height).toBeGreaterThan(bare.height);
    expect(framed.sourceY).toBeGreaterThan(framed.chartY + 300);
  });
});

describe("buildChartSvg", () => {
  it("wraps the chart with an escaped title and source", () => {
    const svg = buildChartSvg("data:image/svg+xml;base64,AAA", {
      width: 600,
      height: 300,
      title: "IDH & renda <2021>",
      source: "Fonte: PNAD",
    });

    expect(svg).toContain('href="data:image/svg+xml;base64,AAA"');
    expect(svg).toContain("IDH &amp; renda &lt;2021&gt;");
    expect(svg).toContain("Fonte: PNAD");
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  });

  it("leaves the text out when there is no title or source", () => {
    expect(buildChartSvg("data:x", { width: 10, height: 10 })).not.toContain(
      "<text",
    );
  });
});

describe("chartImageFileName", () => {
  it("turns the chart title into an ASCII file name", () => {
    expect(
      chartImageFileName(
        "Evolução anual do IDH e do IDH ajustado à desigualdade",
        "png",
      ),
    ).toBe("evolucao-anual-do-idh-e-do-idh-ajustado-a-desigualdade.png");
  });
});
