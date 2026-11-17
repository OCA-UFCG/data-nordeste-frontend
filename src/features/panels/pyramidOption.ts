// Pirâmide etária em ECharts da demo no padrão Power BI
// (/demo/perfil-demografico-powerbi). O painel novo desenha a pirâmide em
// HTML (PerfilPiramideCard); este módulo saiu de chartOptions na PR #400 e
// voltou aqui só para a demo antiga.
import {
  baseOption,
  TEXT_COLOR,
  TOOLTIP_BASE,
  type ValueFormatter,
} from "@/features/panels/chartBase";
import {
  columnLegend,
  FADED_OPACITY,
  type ColumnSeries,
} from "@/features/panels/chartOptions";
import type { ChartOption } from "@/lib/echarts";

export type PyramidConfig = {
  categories: string[];

  // A série da esquerda é desenhada com valores negativos.
  left: ColumnSeries;
  right: ColumnSeries;
  formatValue: ValueFormatter;
  formatShort: ValueFormatter;

  activeIndex?: number | null;
};

// ponytail: larguras estimadas (rótulo do eixo ~80 px, dígito ~7 px a 12 px);
// medir o texto no canvas se a fonte mudar muito.
const PYRAMID_AXIS_LABEL_WIDTH = 76;
const PYRAMID_CHAR_WIDTH = 7;

// Espaço guardado após a maior barra para um número de fora: completo
// ("2.291.237") ou curto ("2,3 mi"). Abaixo de MIN_BAR_AREA, só tooltip.
const PYRAMID_LABEL_ROOM = 72;
const PYRAMID_SHORT_LABEL_ROOM = 52;
const PYRAMID_MIN_BAR_AREA = 48;
const CENTER_LINE_COLOR = "#7e797b";

// O número só vai dentro da barra se couber nela; senão, fica após a ponta.
const pyramidLabel = (
  value: number,
  barPx: number,
  side: "left" | "right",
  scale: PyramidScale,
) => {
  const text = scale.formatValue(value);
  const fits = barPx >= text.length * PYRAMID_CHAR_WIDTH + 8;

  return {
    show: scale.showLabels,
    position: fits ? "inside" : side,
    fontSize: 12,
    color: TEXT_COLOR,
    formatter: () => text,
  };
};

type PyramidScale = {
  pxPerUnit: number;
  axisMax: number;
  showLabels: boolean;
  formatValue: ValueFormatter;
};

const labelRoom = (halfWidth: number, config: PyramidConfig) => {
  if (halfWidth - PYRAMID_LABEL_ROOM >= PYRAMID_MIN_BAR_AREA) {
    return { room: PYRAMID_LABEL_ROOM, formatValue: config.formatValue };
  }
  if (halfWidth - PYRAMID_SHORT_LABEL_ROOM >= PYRAMID_MIN_BAR_AREA) {
    return { room: PYRAMID_SHORT_LABEL_ROOM, formatValue: config.formatShort };
  }

  return null;
};

const pyramidScale = (config: PyramidConfig, width: number): PyramidScale => {
  const largest =
    Math.max(...config.left.values, ...config.right.values, 0) || 1;
  const halfWidth = Math.max(width - 16 - PYRAMID_AXIS_LABEL_WIDTH, 0) / 2;
  const labels = labelRoom(halfWidth, config);
  const barArea = Math.max(halfWidth - (labels?.room ?? 0), 1);

  return {
    pxPerUnit: barArea / largest,
    axisMax: (largest * Math.max(halfWidth, 1)) / barArea,
    showLabels: labels !== null,
    formatValue: labels?.formatValue ?? config.formatValue,
  };
};

const pyramidSeries = (
  series: ColumnSeries,
  side: "left" | "right",
  scale: PyramidScale,
  activeIndex?: number | null,
) => ({
  id: `piramide-${side}`,
  type: "bar",
  name: series.name,
  stack: "piramide",
  barCategoryGap: "12%",
  itemStyle: { color: series.color },
  data: series.values.map((value, index) => ({
    value: side === "left" ? -value : value,
    label: pyramidLabel(value, value * scale.pxPerUnit, side, scale),
    itemStyle: { opacity: fadedUnless(activeIndex, index) },
  })),
});

const centerLine = {
  id: "piramide-centro",
  type: "bar",
  stack: "piramide",
  data: [],
  markLine: {
    silent: true,
    symbol: "none",
    label: { show: false },
    lineStyle: { color: CENTER_LINE_COLOR, type: "solid", width: 1 },
    data: [{ xAxis: 0 }],
  },
};

const PYRAMID_HOVER_COLOR = "rgba(197, 61, 105, 0.08)";

const fadedUnless = (activeIndex: number | null | undefined, index: number) =>
  activeIndex == null || activeIndex === index ? 1 : FADED_OPACITY;

export const buildPyramidOption = (
  config: PyramidConfig,
  width: number,
): ChartOption => {
  const scale = pyramidScale(config, width);

  return {
    ...baseOption(),
    ...columnLegend([config.left, config.right]),
    grid: { left: 8, right: 8, top: 8, bottom: 32, containLabel: true },

    // Sem balão, que cobria as faixas vizinhas: os números da faixa apontada
    // ficam num leitor fora do gráfico. O ponteiro do eixo segue para o hover.
    tooltip: {
      ...TOOLTIP_BASE,
      trigger: "axis",
      showContent: false,
      axisPointer: {
        type: "shadow",
        shadowStyle: { color: PYRAMID_HOVER_COLOR },
      },
    },
    xAxis: {
      type: "value",
      show: false,
      max: scale.axisMax,
      min: -scale.axisMax,
    },
    yAxis: {
      type: "category",
      data: config.categories,
      axisTick: { show: false },
      axisLine: { show: false, onZero: false },
      axisLabel: { fontSize: 12, color: TEXT_COLOR },
    },
    series: [
      pyramidSeries(config.left, "left", scale, config.activeIndex),
      pyramidSeries(config.right, "right", scale, config.activeIndex),
      centerLine,
    ],
  };
};
