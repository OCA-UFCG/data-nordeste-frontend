import { describe, expect, it } from "vitest";
import { downloadChartImage } from "@/lib/chartImage";

class SvgChartFake {
  readonly getDataURL = () => "data:image/svg+xml;base64,AAA";
  readonly getWidth = () => 600;
  readonly getHeight = () => 300;
}

class AnchorDownloadFake {
  readonly anchor = document.createElement("a");
  clicks = 0;

  readonly deps = {
    createAnchor: () => {
      this.anchor.click = () => {
        this.clicks += 1;
      };

      return this.anchor;
    },
  };
}

describe("downloadChartImage", () => {
  it("downloads an SVG with the title and source around the chart", async () => {
    const download = new AnchorDownloadFake();

    await downloadChartImage(
      new SvgChartFake(),
      {
        format: "svg",
        title: "Evolução anual do IDH",
        source: "Fonte: PNAD",
        framed: true,
      },
      download.deps,
    );
    const svg = decodeURIComponent(download.anchor.href.split(",")[1]);

    expect(download.clicks).toBe(1);
    expect(download.anchor.download).toBe("evolucao-anual-do-idh.svg");
    expect(svg).toContain("Evolução anual do IDH");
    expect(svg).toContain("Fonte: PNAD");
  });

  it("leaves the title and source out when the frame is off", async () => {
    const download = new AnchorDownloadFake();

    await downloadChartImage(
      new SvgChartFake(),
      { format: "svg", title: "IDH", source: "Fonte: PNAD", framed: false },
      download.deps,
    );

    expect(decodeURIComponent(download.anchor.href)).not.toContain("<text");
  });
});
