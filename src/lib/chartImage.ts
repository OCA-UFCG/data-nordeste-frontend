import {
  buildChartSvg,
  CHART_IMAGE_TEXT,
  chartImageFileName,
  layoutChartImage,
  type ChartImageFormat,
  type ChartImageFrame,
  type ChartImageLayout,
} from "@/features/panels/chartImage";
import type { StatImageMarkup } from "@/features/panels/statImage";
import { buildMapPosterSvg } from "@/features/panels/mapPoster";
import type { MapPosterData } from "@/features/panels/mapPosterData";
import { browserDownloadDeps, downloadFile } from "@/lib/download";
import { loadPosterAssets } from "@/lib/posterAssets";

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

/**
 * Fonte de imagem a partir de um canvas WebGL (o mapa). O tamanho é o da tela
 * (CSS px), não o do buffer — o buffer já vem multiplicado pelo
 * devicePixelRatio e dobraria o quadro do PNG. O canvas precisa ter sido
 * criado com `preserveDrawingBuffer`, senão `toDataURL` sai em branco.
 *
 * @example await downloadChartImage(canvasImageSource(map.getCanvas()), options)
 */
export const canvasImageSource = (
  canvas: HTMLCanvasElement,
): ChartImageSource => ({
  getWidth: () => canvas.clientWidth,
  getHeight: () => canvas.clientHeight,
  getDataURL: () => canvas.toDataURL("image/png"),
});

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
const createWhiteCanvas = (
  layout: Pick<ChartImageLayout, "width" | "height">,
) => {
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
 * Fonte de imagem a partir de um SVG montado em texto, para cards que na tela
 * são HTML (os indicadores, via buildStatImage).
 *
 * @example await downloadChartImage(svgMarkupSource(buildStatImage(cell)), options)
 */
export const svgMarkupSource = (markup: StatImageMarkup): ChartImageSource => ({
  getWidth: () => markup.width,
  getHeight: () => markup.height,
  getDataURL: () => svgDataUrl(markup.svg),
});

// Cartaz do mapa: o SVG do modelo (cabeçalho, filtros, legenda, rodapé), que no
// PNG é rasterizado a 2× num canvas branco. O SVG-como-imagem não carrega a
// Inter do next/font: o texto sai na pilha de fallback (Arial).
const renderPoster = async (
  chart: ChartImageSource,
  poster: MapPosterData,
  format: ChartImageFormat,
  loadAssets: typeof loadPosterAssets,
) => {
  const { svg, width, height } = buildMapPosterSvg(
    poster,
    {
      dataUrl: chart.getDataURL(),
      width: chart.getWidth(),
      height: chart.getHeight(),
    },
    await loadAssets(poster),
  );

  return format === "svg"
    ? svgDataUrl(svg)
    : renderSvgAsPng(svgDataUrl(svg), { width, height });
};

const renderSvgAsPng = async (
  svgUrl: string,
  size: { width: number; height: number },
) => {
  const { canvas, context } = createWhiteCanvas(size);

  context.drawImage(await loadImage(svgUrl), 0, 0, size.width, size.height);

  return canvas.toDataURL("image/png");
};

// O gráfico simples: com `labels`, título e fonte em volta; sem, só o gráfico.
const renderChart = async (
  chart: ChartImageSource,
  format: ChartImageFormat,
  labels?: { title: string; source?: string },
) => {
  const chartUrl = chart.getDataURL();
  const frame: ChartImageFrame = {
    width: chart.getWidth(),
    height: chart.getHeight(),
    ...labels,
  };

  return format === "svg"
    ? svgDataUrl(buildChartSvg(chartUrl, frame))
    : renderPng(chartUrl, frame);
};

export type ChartDownloadOptions = {
  format: ChartImageFormat;
  title: string;
  source?: string;
  framed: boolean;
  poster?: MapPosterData;
};

const renderDownload = (
  chart: ChartImageSource,
  options: ChartDownloadOptions,
  loadAssets: typeof loadPosterAssets,
) => {
  if (!options.framed) return renderChart(chart, options.format);
  if (options.poster) {
    return renderPoster(chart, options.poster, options.format, loadAssets);
  }

  return renderChart(chart, options.format, {
    title: options.title,
    source: options.source,
  });
};

/**
 * Baixa a imagem de um gráfico em PNG (o SVG rasterizado num canvas a 2×) ou em
 * SVG. Com `framed`, leva título e fonte; com `poster` (os mapas dos painéis),
 * leva o cartaz completo no lugar do quadro simples.
 *
 * @example await downloadChartImage(chart, { format: "png", title: "Mapa do IDH por estado", source: IDH_SOURCE, framed: true, poster })
 */
export const downloadChartImage = async (
  chart: ChartImageSource,
  options: ChartDownloadOptions,
  deps = browserDownloadDeps,
  loadAssets: typeof loadPosterAssets = loadPosterAssets,
): Promise<void> => {
  const url = await renderDownload(chart, options, loadAssets);

  await downloadFile(
    url,
    chartImageFileName(options.title, options.format),
    deps,
  );
};
