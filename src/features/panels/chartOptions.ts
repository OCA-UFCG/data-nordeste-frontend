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

const columnLegend = (series: ColumnSeries[]) =>
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
  canPan?: boolean;
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

      // Em tela de toque, arrastar com um dedo rola a página, não o mapa.
      roam: config.canPan ? true : "scale",
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
