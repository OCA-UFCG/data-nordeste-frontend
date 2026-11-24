import {
  buildChartSvg,
  CHART_IMAGE_TEXT,
  chartImageFileName,
  layoutChartImage,
  type ChartImageFormat,
  type ChartImageFrame,
  type ChartImageLayout,
} from "@/features/panels/chartImage";
import { browserDownloadDeps, downloadFile } from "@/lib/download";

// O que a exportação precisa do gráfico: a imagem (data URL) e o tamanho na
// tela. O teste passa um fake; no painel, vem de svgImageSource.
export type ChartImageSource = {
  getDataURL: () => string;
  getWidth: () => number;
  getHeight: () => number;
};

/**
 * Fonte de imagem a partir de um gráfico desenhado em SVG. As cores e a fonte
 * precisam estar em atributos do SVG (não em classes CSS), senão o arquivo
 * baixado sai sem elas.
 *
 * @example await downloadChartImage(svgImageSource(svgRef.current), options)
 */
export const svgImageSource = (svg: SVGSVGElement): ChartImageSource => {
  const { width, height } = svg.getBoundingClientRect();

  return {
    getWidth: () => width,
    getHeight: () => height,
    getDataURL: () => {
      const copy = svg.cloneNode(true) as SVGSVGElement;

      copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      copy.setAttribute("width", String(width));
      copy.setAttribute("height", String(height));

      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copy))}`;
    },
  };
};

// 2×: nítido em telas de alta densidade e ao ampliar num documento.
const PIXEL_RATIO = 2;

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(
        new Error(
          `Chart image failed to load from a ${url.length}-character data URL starting "${url.slice(0, 30)}"; expected a PNG or SVG data URL.`,
        ),
      );
    image.src = url;
  });

const drawText = (
  context: CanvasRenderingContext2D,
  text: string | undefined,
  position: { x: number; y: number },
  style: (typeof CHART_IMAGE_TEXT)[keyof typeof CHART_IMAGE_TEXT],
) => {
  if (!text) return;
  context.font = `${style.weight} ${style.size}px Inter, sans-serif`;
  context.fillStyle = style.color;
  context.fillText(text, position.x, position.y);
};

// Canvas branco no tamanho da imagem final, já na escala de PIXEL_RATIO.
const createWhiteCanvas = (layout: ChartImageLayout) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error(
      `Canvas 2D context unavailable for a ${layout.width}×${layout.height} chart image; expected a browser with canvas support.`,
    );
  }
  canvas.width = layout.width * PIXEL_RATIO;
  canvas.height = layout.height * PIXEL_RATIO;
  context.scale(PIXEL_RATIO, PIXEL_RATIO);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, layout.width, layout.height);

  return { canvas, context };
};

// PNG pelo canvas: serve aos dois renderers (o SVG da linha é rasterizado aqui).
const renderPng = async (chartUrl: string, frame: ChartImageFrame) => {
  const layout = layoutChartImage(frame);
  const { canvas, context } = createWhiteCanvas(layout);
  const image = await loadImage(chartUrl);
  const x = layout.chartX;

  context.drawImage(image, x, layout.chartY, frame.width, frame.height);
  drawText(
    context,
    frame.title,
    { x, y: layout.titleY },
    CHART_IMAGE_TEXT.title,
  );
  drawText(
    context,
    frame.source,
    { x, y: layout.sourceY },
    CHART_IMAGE_TEXT.source,
  );

  return canvas.toDataURL("image/png");
};

const svgDataUrl = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/**
 * Baixa a imagem de um gráfico, com título e fonte opcionais, em PNG (o SVG
 * rasterizado num canvas a 2×) ou em SVG.
 *
 * @example await downloadChartImage(chart, { format: "png", title: "Mapa do IDH por estado", source: IDH_SOURCE })
 */
export const downloadChartImage = async (
  chart: ChartImageSource,
  options: {
    format: ChartImageFormat;
    title: string;
    source?: string;
    framed: boolean;
  },
  deps = browserDownloadDeps,
): Promise<void> => {
  const chartUrl = chart.getDataURL();
  const frame: ChartImageFrame = {
    width: chart.getWidth(),
    height: chart.getHeight(),
    ...(options.framed ? { title: options.title, source: options.source } : {}),
  };
  const url =
    options.format === "svg"
      ? svgDataUrl(buildChartSvg(chartUrl, frame))
      : await renderPng(chartUrl, frame);

  await downloadFile(
    url,
    chartImageFileName(options.title, options.format),
    deps,
  );
};
