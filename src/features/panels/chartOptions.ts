import { getBucket, type ChoroplethBucket } from "@/features/panels/choropleth";
import { getAspectScale, type MapBounds } from "@/features/panels/mapFraming";
import type { ChartOption } from "@/lib/echarts";

export type ValueFormatter = (value: number) => string;
export type ChartPoint = { label: string; value: number };

const FONT_SIZE = 14;
const TEXT_COLOR = "#292829";
const MUTED_COLOR = "#5c5c5c";
const ACCENT = "#f5791a";
const ACCENT_DARK = "#be4610";
const SELECTED_BORDER = "#077432";
const COMPACT_WIDTH = 560;
const LABEL_SLOT_WIDTH = 96;

export const isCompactChart = (width: number): boolean => width < COMPACT_WIDTH;

const TOOLTIP_BASE = {
  confine: true,
  textStyle: { fontSize: FONT_SIZE, color: TEXT_COLOR },
};

const baseOption = (): ChartOption => ({
  aria: { enabled: true },
  textStyle: { fontSize: FONT_SIZE, color: TEXT_COLOR },
  tooltip: TOOLTIP_BASE,
});

export type TrendConfig = {
  points: ChartPoint[];
  seriesName: string;
  selectedIndex: number;
  formatLabel: ValueFormatter;
  formatValue: ValueFormatter;
  formatAxis: ValueFormatter;
};

const trendLabel = (config: TrendConfig, width: number) => {
  const everyLabelFits = width / config.points.length >= LABEL_SLOT_WIDTH;
  const lastIndex = config.points.length - 1;
  const labelled = (index: number) =>
    everyLabelFits || index === lastIndex || index === config.selectedIndex;

  return {
    show: true,
    position: "top",
    fontSize: FONT_SIZE,
    color: MUTED_COLOR,
    formatter: ({ value, dataIndex }: { value: number; dataIndex: number }) =>
      labelled(dataIndex) ? config.formatLabel(value) : "",
  };
};

const trendSeries = (config: TrendConfig, width: number) => ({
  type: "line",
  name: config.seriesName,
  data: config.points.map((point, index) => ({
    value: point.value,
    symbolSize: index === config.selectedIndex ? 14 : 8,
    itemStyle: {
      color: index === config.selectedIndex ? ACCENT_DARK : ACCENT,
    },
  })),
  lineStyle: { color: ACCENT, width: 3, type: "dotted" },
  label: trendLabel(config, width),
  labelLayout: { hideOverlap: true },
});

const trendAxes = (config: TrendConfig, compact: boolean) => ({
  xAxis: {
    type: "category",
    data: config.points.map((point) => point.label),
    axisLabel: {
      fontSize: FONT_SIZE,
      color: MUTED_COLOR,
      interval: compact ? 3 : "auto",
    },
    axisTick: { show: false },
  },
  yAxis: {
    type: "value",
    splitNumber: compact ? 3 : 4,
    axisLabel: {
      fontSize: FONT_SIZE,
      color: MUTED_COLOR,
      formatter: config.formatAxis,
    },
  },
});

export const buildTrendOption = (
  config: TrendConfig,
  width: number,
): ChartOption => {
  const compact = isCompactChart(width);

  return {
    ...baseOption(),
    grid: {
      left: 8,
      right: compact ? 56 : 48,
      top: 36,
      bottom: 8,
      containLabel: true,
    },
    tooltip: {
      ...TOOLTIP_BASE,
      trigger: "axis",
      valueFormatter: config.formatValue,
    },
    ...trendAxes(config, compact),
    series: [trendSeries(config, width)],
  };
};

const barSeries = (
  points: ChartPoint[],
  formatValue: ValueFormatter,
  color: string,
) => ({
  type: "bar",
  data: points.map((point) => point.value),
  barMaxWidth: 36,
  itemStyle: { color, borderRadius: [0, 4, 4, 0] },
  label: {
    show: true,
    position: "right",
    fontSize: FONT_SIZE,
    color: TEXT_COLOR,
    formatter: ({ value }: { value: number }) => formatValue(value),
  },
});

export const buildHorizontalBarOption = (
  points: ChartPoint[],
  formatValue: ValueFormatter,
  width: number,
  color = ACCENT,
): ChartOption => ({
  ...baseOption(),
  grid: { left: 8, right: 96, top: 8, bottom: 8, containLabel: true },
  tooltip: {
    ...TOOLTIP_BASE,
    trigger: "axis",
    axisPointer: { type: "shadow" },
    valueFormatter: formatValue,
  },
  xAxis: { type: "value", show: false },
  yAxis: {
    type: "category",
    inverse: true,
    data: points.map((point) => point.label),
    axisTick: { show: false },
    axisLabel: {
      fontSize: FONT_SIZE,
      color: TEXT_COLOR,
      width: isCompactChart(width) ? 110 : 160,
      overflow: "break",
      lineHeight: 18,
    },
  },
  series: [barSeries(points, formatValue, color)],
});

export type ColumnSeries = { name: string; color: string; values: number[] };

export type ColumnConfig = {
  categories: string[];
  series: ColumnSeries[];
  formatLabel: ValueFormatter;
  formatValue: ValueFormatter;
};

const columnSeries = (series: ColumnSeries, formatLabel: ValueFormatter) => ({
  type: "bar",
  name: series.name,
  data: series.values,
  barMaxWidth: 36,
  barGap: "12%",
  itemStyle: { color: series.color },
  label: {
    show: true,
    position: "top",
    fontSize: 12,
    color: TEXT_COLOR,
    formatter: ({ value }: { value: number }) => formatLabel(value),
  },
  labelLayout: { hideOverlap: true },
});

const columnLegend = (series: { name: string }[]) =>
  series.length > 1
    ? {
        legend: {
          bottom: 0,
          icon: "circle",
          itemWidth: 14,
          itemHeight: 14,
          textStyle: { fontSize: 12, fontWeight: 600, color: TEXT_COLOR },
        },
      }
    : {};

export const buildColumnOption = (config: ColumnConfig): ChartOption => ({
  ...baseOption(),
  ...columnLegend(config.series),
  grid: {
    left: 8,
    right: 8,
    top: 28,
    bottom: config.series.length > 1 ? 32 : 8,
    containLabel: true,
  },
  tooltip: {
    ...TOOLTIP_BASE,
    trigger: "axis",
    axisPointer: { type: "shadow" },
    valueFormatter: config.formatValue,
  },
  xAxis: {
    type: "category",
    data: config.categories,
    axisTick: { show: false },
    axisLabel: { fontSize: FONT_SIZE, fontWeight: 500, color: TEXT_COLOR },
  },
  yAxis: { type: "value", show: false },
  series: config.series.map((series) =>
    columnSeries(series, config.formatLabel),
  ),
});

export type ChoroplethRegion = {
  code: string;
  name: string;
  uf: string;
  value: number;
};

export type ChoroplethConfig = {
  regions: ChoroplethRegion[];
  buckets: readonly ChoroplethBucket[];
  mapName: string;
  valueLabel: string;
  formatValue: ValueFormatter;
  selectedCode?: string;
  bounds?: MapBounds;
  width?: number;
};

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"]/g, (char) => HTML_ESCAPES[char]);

const choroplethTooltip =
  (config: ChoroplethConfig) =>
  ({ data }: { data?: { nome: string; uf: string; value: number } }) => {
    if (!data) return "";
    const place = escapeHtml(`${data.nome} (${data.uf})`);

    return `<strong>${place}</strong><br/>${escapeHtml(config.valueLabel)}: ${config.formatValue(data.value)}`;
  };

const choroplethRegions = (config: ChoroplethConfig) =>
  config.regions.map((region) => ({
    name: region.code,
    value: region.value,
    nome: region.name,
    uf: region.uf,
    itemStyle: {
      areaColor: getBucket(config.buckets, region.value).color,
      ...(region.code === config.selectedCode
        ? { borderColor: SELECTED_BORDER, borderWidth: 3 }
        : {}),
    },
  }));

const MAP_PAN_MIN_WIDTH = 640;

const choroplethFraming = (bounds: MapBounds | undefined) =>
  bounds ? { boundingCoords: bounds, aspectScale: getAspectScale(bounds) } : {};

export const buildChoroplethOption = (
  config: ChoroplethConfig,
): ChartOption => ({
  ...baseOption(),
  tooltip: {
    ...TOOLTIP_BASE,
    trigger: "item",
    formatter: choroplethTooltip(config),
  },
  series: [
    {
      type: "map",
      map: config.mapName,
      roam: (config.width ?? Infinity) < MAP_PAN_MIN_WIDTH ? "scale" : true,
      scaleLimit: { min: 1, max: 40 },
      selectedMode: false,
      left: 4,
      right: 4,
      top: 4,
      bottom: 4,

      // Sem isso o ECharts 6 estica a região para preencher a caixa.
      preserveAspect: "contain",
      ...choroplethFraming(config.bounds),
      itemStyle: { borderColor: "#ffffff", borderWidth: 0.3 },
      emphasis: {
        label: { show: false },
        itemStyle: { areaColor: SELECTED_BORDER },
      },
      data: choroplethRegions(config),
    },
  ],
});

export type PieSlice = ChartPoint & { color: string };

// Inteiro, como no Figma ("45%"); o valor exato fica no tooltip.
const percentLabel = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});

const pieLabel = {
  show: true,
  position: "inside",
  fontSize: 20,
  fontWeight: "bold",
  color: "#ffffff",
  formatter: ({ percent }: { percent: number }) =>
    `${percentLabel.format(percent)}%`,
};

export const buildPieOption = (
  slices: PieSlice[],
  formatValue: ValueFormatter,
): ChartOption => ({
  ...baseOption(),
  ...columnLegend(slices.map((slice) => ({ name: slice.label }))),
  tooltip: { ...TOOLTIP_BASE, trigger: "item", valueFormatter: formatValue },
  series: [
    {
      type: "pie",
      radius: "75%",

      // Anti-horário: a primeira fatia (Mulher) fica à esquerda, como no Figma.
      clockwise: false,
      center: ["50%", "45%"],
      label: pieLabel,
      labelLine: { show: false },
      data: slices.map((slice) => ({
        name: slice.label,
        value: slice.value,
        itemStyle: { color: slice.color },
      })),
    },
  ],
});

export type PyramidConfig = {
  categories: string[];

  // A série da esquerda é desenhada com valores negativos.
  left: ColumnSeries;
  right: ColumnSeries;
  formatValue: ValueFormatter;
  formatShort: ValueFormatter;
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
) => ({
  type: "bar",
  name: series.name,
  stack: "piramide",
  barCategoryGap: "12%",
  itemStyle: { color: series.color },
  data: series.values.map((value) => ({
    value: side === "left" ? -value : value,
    label: pyramidLabel(value, value * scale.pxPerUnit, side, scale),
  })),
});

const centerLine = {
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

export const buildPyramidOption = (
  config: PyramidConfig,
  width: number,
): ChartOption => {
  const scale = pyramidScale(config, width);

  return {
    ...baseOption(),
    ...columnLegend([config.left, config.right]),
    grid: { left: 8, right: 8, top: 8, bottom: 32, containLabel: true },
    tooltip: {
      ...TOOLTIP_BASE,
      trigger: "axis",
      axisPointer: { type: "shadow" },
      valueFormatter: (value: number) => config.formatValue(Math.abs(value)),
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
      pyramidSeries(config.left, "left", scale),
      pyramidSeries(config.right, "right", scale),
      centerLine,
    ],
  };
};
