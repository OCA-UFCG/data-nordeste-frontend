import {
  getBucket,
  rankRegions,
  type ChoroplethBucket,
} from "@/features/panels/choropleth";
import { getAspectScale, type MapFraming } from "@/features/panels/mapFraming";
import type { ChartOption } from "@/lib/echarts";
import {
  ACCENT,
  AXIS_COLOR,
  baseOption,
  type ChartPoint,
  FONT_SIZE,
  isCompactChart,
  SELECTED_BORDER,
  TEXT_COLOR,
  TOOLTIP_BASE,
  tooltipHtml,
  type ValueFormatter,
} from "@/features/panels/chartBase";

export {
  isCompactChart,
  type ChartPoint,
  type ValueFormatter,
} from "@/features/panels/chartBase";

export type BarPoint = ChartPoint & { color?: string };

const barSeries = (
  points: BarPoint[],
  formatValue: ValueFormatter,
  color: string,
) => ({
  // id fixo: na troca de filtro as barras crescem ou encolhem até o valor novo.
  id: "bars",
  type: "bar",
  data: points.map((point) =>
    point.color
      ? { value: point.value, itemStyle: { color: point.color } }
      : point.value,
  ),

  // A espessura acompanha a altura do card (40% da faixa fica de ar), até 32 px.
  barCategoryGap: "40%",
  barMaxWidth: 32,
  itemStyle: { color, borderRadius: [0, 4, 4, 0] },
  emphasis: { focus: "self" },
  blur: { itemStyle: { opacity: 0.45 }, label: { opacity: 0.75 } },
  label: {
    show: true,
    position: "right",
    fontSize: FONT_SIZE,
    color: TEXT_COLOR,
    formatter: ({ value }: { value: number }) => formatValue(value),
  },
});

export const buildHorizontalBarOption = (
  points: BarPoint[],
  formatValue: ValueFormatter,
  width: number,
  color = ACCENT,
): ChartOption => ({
  ...baseOption(),
  grid: { left: 8, right: 96, top: 8, bottom: 8, containLabel: true },
  tooltip: {
    ...TOOLTIP_BASE,

    // Tooltip na própria barra, sem a faixa cinza da categoria.
    trigger: "item",
    valueFormatter: formatValue,
  },
  xAxis: { type: "value", show: false },
  yAxis: {
    type: "category",
    inverse: true,
    data: points.map((point) => point.label),
    axisTick: { show: false },
    axisLine: { lineStyle: { color: AXIS_COLOR } },
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

type TooltipRect = { x: number; y: number; width: number };
type TooltipSize = { contentSize: number[]; viewSize: number[] };

// Acima da coluna apontada e do rótulo dela: seguindo o mouse, o balão cobria a
// coluna vizinha.
const aboveColumn = (
  _point: number[],
  _params: unknown,
  _dom: unknown,
  rect: TooltipRect | null,
  { contentSize, viewSize }: TooltipSize,
) => {
  if (!rect) return undefined;
  const [width, height] = contentSize;
  const x = rect.x + rect.width / 2 - width / 2;

  return [
    Math.min(Math.max(x, 0), viewSize[0] - width),
    Math.max(rect.y - height - 22, 0),
  ];
};

const FADED_OPACITY = 0.35;

export const FOCUS_BAR = {
  emphasis: { focus: "self" },
  blur: { itemStyle: { opacity: FADED_OPACITY } },
};

const columnSeries = (series: ColumnSeries, formatLabel: ValueFormatter) => ({
  id: series.name,
  type: "bar",
  name: series.name,
  data: series.values,
  barMaxWidth: 36,
  barGap: "12%",
  itemStyle: { color: series.color },
  ...FOCUS_BAR,
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
    trigger: "item",
    position: aboveColumn,
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

// O que pinta o mapa: muda sem mexer no zoom nem no arrasto do usuário.
export type ChoroplethColors = {
  regions: ChoroplethRegion[];
  buckets: readonly ChoroplethBucket[];
  valueLabel: string;
  formatValue: ValueFormatter;
  selectedCode?: string;

  // Só estes municípios ficam coloridos; os demais vão para o cinza.
  highlightCodes?: ReadonlySet<string>;
};

// O que posiciona o mapa: mudar isso redesenha e volta ao enquadramento inicial.
export type ChoroplethFrame = {
  mapName: string;
  framing?: MapFraming;
  canPan?: boolean;
};

type ChoroplethItem = { nome: string; uf: string; value: number; rank: number };

const rankFormat = new Intl.NumberFormat("pt-BR");

const choroplethTooltip =
  (config: ChoroplethColors) =>
  ({ data }: { data?: ChoroplethItem }) => {
    if (!data) return "";
    const total = config.regions.length;
    const rank =
      total > 1
        ? [`${rankFormat.format(data.rank)}º de ${rankFormat.format(total)}`]
        : [];

    return tooltipHtml(
      `${data.nome} (${data.uf})`,
      `${config.valueLabel}: ${config.formatValue(data.value)}`,
      rank,
    );
  };

const DIMMED_AREA = "#e5e5e5";

const HOVER_BORDER = TEXT_COLOR;

const regionAreaColor = (config: ChoroplethColors, region: ChoroplethRegion) =>
  config.highlightCodes && !config.highlightCodes.has(region.code)
    ? DIMMED_AREA
    : getBucket(config.buckets, region.value).color;

// PERF: o ranking só depende das regiões, mas a opção de cor é refeita a cada
// destaque (hover na lista). Um por array de regiões, e o GC limpa os antigos.
const ranksByRegions = new WeakMap<ChoroplethRegion[], Map<string, number>>();

const cachedRanks = (regions: ChoroplethRegion[]) => {
  const cached = ranksByRegions.get(regions);

  if (cached) return cached;
  const ranks = rankRegions(regions);

  ranksByRegions.set(regions, ranks);

  return ranks;
};

// No hover a região mantém a cor e ganha contorno; a escolhida segue verde.
const choroplethRegions = (config: ChoroplethColors) => {
  const ranks = cachedRanks(config.regions);

  return config.regions.map((region) => {
    const areaColor = regionAreaColor(config, region);
    const selected = region.code === config.selectedCode;
    const border = selected
      ? { borderColor: SELECTED_BORDER, borderWidth: 3 }
      : {};

    return {
      name: region.code,
      value: region.value,
      nome: region.name,
      uf: region.uf,
      rank: ranks.get(region.code) ?? 0,
      itemStyle: { areaColor, ...border },
      emphasis: {
        itemStyle: {
          areaColor,
          borderColor: selected ? SELECTED_BORDER : HOVER_BORDER,
          borderWidth: selected ? 3 : 1.5,
        },
      },
    };
  });
};

const choroplethFraming = (framing: MapFraming | undefined) =>
  framing
    ? {
        boundingCoords: framing.bounds,
        aspectScale: getAspectScale(framing.bounds),
        scaleLimit: { min: 1, max: framing.maxZoom },
        ...framing.focus,
      }
    : { scaleLimit: { min: 1 } };

// Comum à série `map` e ao componente `geo` (mapa com camadas).
export const mapViewportOption = (frame: ChoroplethFrame) => ({
  map: frame.mapName,

  // Em tela de toque, arrastar com um dedo rola a página, não o mapa.
  roam: frame.canPan ? true : "scale",
  selectedMode: false,
  left: 4,
  right: 4,
  top: 4,
  bottom: 4,

  // Sem isso o ECharts 6 estica a região para preencher a caixa.
  preserveAspect: "contain",
  ...choroplethFraming(frame.framing),
  itemStyle: { borderColor: "#ffffff", borderWidth: 0.3 },
  emphasis: { label: { show: false } },
});

// As duas opções casam pelo id: a de cores entra por merge sobre a do quadro.
const CHOROPLETH_SERIES_ID = "choropleth";

/**
 * Geometria e enquadramento do mapa, sem os dados. Aplicada do zero (notMerge)
 * só quando o conjunto de regiões ou o quadro muda.
 *
 * @example buildChoroplethFrameOption({ mapName: "sudene", canPan: true })
 */
export const buildChoroplethFrameOption = (
  frame: ChoroplethFrame,
): ChartOption => ({
  ...baseOption(),
  series: [
    {
      id: CHOROPLETH_SERIES_ID,
      type: "map",
      ...mapViewportOption(frame),
    },
  ],
});

/**
 * Cores, destaque e balão do mapa, aplicados por merge sobre o quadro.
 * IMPORTANT: sem center/zoom; com eles, cada destaque desfaria o zoom e o
 * arrasto do usuário.
 *
 * @example buildChoroplethColorOption({ regions, buckets, valueLabel: "PIB", formatValue })
 */
export const buildChoroplethColorOption = (
  colors: ChoroplethColors,
): ChartOption => ({
  tooltip: {
    ...TOOLTIP_BASE,
    trigger: "item",
    formatter: choroplethTooltip(colors),
  },
  series: [
    {
      id: CHOROPLETH_SERIES_ID,
      type: "map",
      data: choroplethRegions(colors),
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
      id: "pie",
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
