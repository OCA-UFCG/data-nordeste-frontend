import { describe, expect, it } from "vitest";
import { canvasImageSource, downloadChartImage } from "@/lib/chartImage";

class SvgChartFake {
  readonly getDataURL = () => "data:image/svg+xml;base64,AAA";
  readonly getWidth = () => 600;
  readonly getHeight = () => 300;
}

// Canvas de um mapa numa tela 2×: o buffer tem o dobro do tamanho na tela.
class MapCanvasFake {
  readonly width = 1280;
  readonly height = 960;
  readonly clientWidth = 640;
  readonly clientHeight = 480;
  requestedTypes: string[] = [];

  readonly toDataURL = (type: string) => {
    this.requestedTypes.push(type);

    return "data:image/png;base64,MAP";
  };

  asCanvas() {
    return this as unknown as HTMLCanvasElement;
  }
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

describe("canvasImageSource", () => {
  it("reports the on-screen size, not the device-pixel buffer", () => {
    const source = canvasImageSource(new MapCanvasFake().asCanvas());

    expect([source.getWidth(), source.getHeight()]).toEqual([640, 480]);
  });

  it("reads the canvas as a PNG data URL", () => {
    const canvas = new MapCanvasFake();

    const url = canvasImageSource(canvas.asCanvas()).getDataURL();

    expect(url).toBe("data:image/png;base64,MAP");
    expect(canvas.requestedTypes).toEqual(["image/png"]);
  });
});
