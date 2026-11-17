import { MUTED_COLOR, TEXT_COLOR } from "@/features/panels/chartBase";

export type ChartImageFormat = "png" | "svg";

// Tamanho do gráfico na tela (px CSS); título e fonte são opcionais ("Incluir
// título e fonte" no menu do card).
export type ChartImageFrame = {
  width: number;
  height: number;
  title?: string;
  source?: string;
};

export type ChartImageLayout = {
  width: number;
  height: number;
  chartX: number;
  chartY: number;
  titleY: number;
  sourceY: number;
};

const PADDING = 24;
const GAP = 12;

// Os mesmos textos no PNG (canvas) e no SVG.
export const CHART_IMAGE_TEXT = {
  title: { size: 20, weight: 600, color: TEXT_COLOR },
  source: { size: 13, weight: 400, color: MUTED_COLOR },
} as const;

/**
 * Onde cada parte da imagem baixada fica: título em cima, gráfico no meio e
 * fonte embaixo, com margem branca em volta. `titleY` e `sourceY` são as
 * linhas de base do texto.
 *
 * @example layoutChartImage({ width: 600, height: 300, title: "IDH" }).chartY // 56
 */
export const layoutChartImage = ({
  width,
  height,
  title,
  source,
}: ChartImageFrame): ChartImageLayout => {
  const chartY = title ? PADDING + CHART_IMAGE_TEXT.title.size + GAP : PADDING;
  const below = source ? GAP + CHART_IMAGE_TEXT.source.size + PADDING : PADDING;

  return {
    width: width + PADDING * 2,
    height: chartY + height + below,
    chartX: PADDING,
    chartY,
    titleY: PADDING + CHART_IMAGE_TEXT.title.size,
    sourceY: chartY + height + GAP + CHART_IMAGE_TEXT.source.size,
  };
};

const escapeXml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const svgText = (
  text: string | undefined,
  y: number,
  style: (typeof CHART_IMAGE_TEXT)[keyof typeof CHART_IMAGE_TEXT],
) =>
  text
    ? `<text x="${PADDING}" y="${y}" font-family="Inter, sans-serif" font-size="${style.size}" font-weight="${style.weight}" fill="${style.color}">${escapeXml(text)}</text>`
    : "";

/**
 * Imagem SVG do card: o gráfico (data URL do ECharts) com título e fonte em
 * volta. Os textos são escapados porque vêm de títulos e fontes do painel.
 *
 * @example buildChartSvg(chart.getDataURL(), { width: 600, height: 300, title: "IDH" })
 */
export const buildChartSvg = (
  chartUrl: string,
  frame: ChartImageFrame,
): string => {
  const layout = layoutChartImage(frame);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">`,
    `<rect width="100%" height="100%" fill="#ffffff"/>`,
    svgText(frame.title, layout.titleY, CHART_IMAGE_TEXT.title),
    `<image href="${escapeXml(chartUrl)}" x="${layout.chartX}" y="${layout.chartY}" width="${frame.width}" height="${frame.height}"/>`,
    svgText(frame.source, layout.sourceY, CHART_IMAGE_TEXT.source),
    "</svg>",
  ].join("");
};

/**
 * Nome do arquivo a partir do título do card, sem acentos nem espaços.
 *
 * @example chartImageFileName("Mapa do IDH por estado", "png") // "mapa-do-idh-por-estado.png"
 */
export const chartImageFileName = (
  title: string,
  format: ChartImageFormat,
): string => {
  const slug = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${slug || "grafico"}.${format}`;
};
