import { describe, expect, it } from "vitest";
import { buildStatImage } from "@/features/panels/statImage";
import type { MapPosterData } from "@/features/panels/mapPosterData";
import {
  canvasImageSource,
  downloadChartImage,
  svgMarkupSource,
} from "@/lib/chartImage";

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

const POSTER: MapPosterData = {
  panelName: "Painel de Economia e Renda",
  icon: "usd",
  accent: "#e5640f",
  title: "Mapa do PIB - Nordeste",
  subtitle: "PIB por município - 2021",
  chips: ["Ano: 2021"],
  legend: [{ color: "#fde6c8", label: "< R$ 50 Bi" }],
  inset: null,
  source: "Fonte: IBGE · Data Nordeste",
  updatedAt: "11/2026",
};

class PosterAssetsFake {
  requested: string[] = [];

  readonly load = async (poster: Pick<MapPosterData, "icon">) => {
    this.requested.push(poster.icon);

    return {
      logoDataUrl: "data:image/png;base64,LOGO",
      iconMarkup: '<path d="M0 0"/>',
    };
  };
}

class MapCanvasSourceFake {
  readonly getDataURL = () => "data:image/png;base64,MAP";
  readonly getWidth = () => 640;
  readonly getHeight = () => 480;
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

describe("svgMarkupSource", () => {
  it("downloads a big number, drawn as SVG, framed by its label", async () => {
    const download = new AnchorDownloadFake();
    const markup = buildStatImage({ value: "54,6 mi", caption: "em 2022" });

    await downloadChartImage(
      svgMarkupSource(markup),
      {
        format: "svg",
        title: "População residente",
        source: "Fonte: IBGE",
        framed: true,
      },
      download.deps,
    );
    const svg = decodeURIComponent(download.anchor.href.split(",")[1]);

    expect(download.anchor.download).toBe("populacao-residente.svg");
    expect(svg).toContain("População residente");
    expect(svg).toContain(`width="${markup.width}"`);

    // O número vai como imagem interna: o `href` tem o SVG dele codificado.
    const inner = /href="([^"]+)"/.exec(svg)?.[1] ?? "";

    expect(decodeURIComponent(inner)).toContain(">54,6 mi</text>");
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

describe("downloadChartImage with a poster", () => {
  const options = {
    format: "svg" as const,
    title: "Mapa do PIB - Nordeste",
    source: "Fonte: IBGE",
    framed: true,
    poster: POSTER,
  };

  it("downloads the poster instead of the simple frame", async () => {
    const download = new AnchorDownloadFake();
    const assets = new PosterAssetsFake();

    await downloadChartImage(
      new MapCanvasSourceFake(),
      options,
      download.deps,
      assets.load,
    );
    const svg = decodeURIComponent(download.anchor.href.split(",")[1]);

    expect(download.anchor.download).toBe("mapa-do-pib-nordeste.svg");
    expect(assets.requested).toEqual(["usd"]);
    expect(svg).toContain("Painel de Economia e Renda");
    expect(svg).toContain("Atualizado em 11/2026");
    expect(svg).toContain("data:image/png;base64,MAP");
  });

  it("falls back to the simple frame when there is no poster", async () => {
    const download = new AnchorDownloadFake();
    const assets = new PosterAssetsFake();

    await downloadChartImage(
      new MapCanvasSourceFake(),
      { ...options, poster: undefined },
      download.deps,
      assets.load,
    );
    const svg = decodeURIComponent(download.anchor.href.split(",")[1]);

    expect(assets.requested).toEqual([]);
    expect(svg).not.toContain("Painel de Economia e Renda");
    expect(svg).toContain("Fonte: IBGE");
  });

  it("leaves the poster out when the frame is off", async () => {
    const download = new AnchorDownloadFake();
    const assets = new PosterAssetsFake();

    await downloadChartImage(
      new MapCanvasSourceFake(),
      { ...options, framed: false },
      download.deps,
      assets.load,
    );

    expect(assets.requested).toEqual([]);
    expect(decodeURIComponent(download.anchor.href)).not.toContain("<text");
  });
});
