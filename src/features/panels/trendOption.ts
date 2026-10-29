import {
  ACCENT,
  ACCENT_DARK,
  AXIS_COLOR,
  baseOption,
  type ChartPoint,
  FONT_SIZE,
  GRID_COLOR,
  isCompactChart,
  MUTED_COLOR,
  TEXT_COLOR,
  TOOLTIP_BASE,
  tooltipHtml,
  type ValueFormatter,
} from "@/features/panels/chartBase";
import type { ChartOption } from "@/lib/echarts";
import {
  describeYearChange,
  formatYearChange,
} from "@/features/panels/yearChange";

export type TrendConfig = {
  points: ChartPoint[];
  seriesName: string;
  selectedIndex: number;
  formatLabel: ValueFormatter;
  formatValue: ValueFormatter;
  formatAxis: ValueFormatter;
};

// ponytail: larguras estimadas a 14 px, com folga ("R$ 1,51 Tri", "2010", eixo Y
// e margens); medir o texto no canvas se a fonte ou o formato mudarem.
const LABEL_SLOT_WIDTH = 96;
const YEAR_LABEL_WIDTH = 44;
const PLOT_CHROME_WIDTH = 170;

// Largura de cada ano na área do gráfico (sem eixo Y e margens).
const plotSlot = (width: number, count: number) =>
  Math.max(width - PLOT_CHROME_WIDTH, 1) / Math.max(count, 1);

/**
 * Pontos com rótulo de valor: o ano escolhido e as duas pontas da série. Uma
 * ponta a menos de `minGap` pontos do escolhido fica sem rótulo, para os dois
 * textos não se sobreporem. Os demais valores ficam no balão.
 *
 * @example trendLabelIndexes(14, 11, 3) // Set {11, 0}: 2023 está a 2 pontos de 2021
 */
export const trendLabelIndexes = (
  count: number,
  selectedIndex: number,
  minGap: number,
): Set<number> => {
  const indexes = new Set<number>(selectedIndex >= 0 ? [selectedIndex] : []);
  const ends = count > 0 ? [0, count - 1] : [];

  ends
    .filter(
      (end) => selectedIndex < 0 || Math.abs(end - selectedIndex) >= minGap,
    )
    .forEach((end) => indexes.add(end));

  return indexes;
};

// Abaixo disto é o celular: o valor do ano vai no SelectedValue (só abaixo do sm).
// No lg o gráfico também é estreito, mas sem esse destaque precisa dos rótulos.
const PHONE_CHART_WIDTH = 380;

const labeledIndexes = (config: TrendConfig, width: number) => {
  if (width < PHONE_CHART_WIDTH) return new Set<number>();

  return trendLabelIndexes(
    config.points.length,
    config.selectedIndex,
    Math.ceil(LABEL_SLOT_WIDTH / plotSlot(width, config.points.length)),
  );
};

const trendLabel = (config: TrendConfig, width: number) => {
  const indexes = labeledIndexes(config, width);

  return {
    show: true,
    position: "top",
    distance: 10,
    fontSize: FONT_SIZE,
    color: MUTED_COLOR,

    // Contorno branco: o rótulo fica legível onde a linha sobe e cruza o texto.
    textBorderColor: "#fff",
    textBorderWidth: 3,
    formatter: ({ value, dataIndex }: { value: number; dataIndex: number }) =>
      indexes.has(dataIndex) ? config.formatLabel(value) : "",
  };
};

const trendPoint = (config: TrendConfig, point: ChartPoint, index: number) =>
  index === config.selectedIndex
    ? {
        value: point.value,
        symbolSize: 14,
        itemStyle: { color: ACCENT_DARK, borderWidth: 2.5 },
        label: { color: TEXT_COLOR, fontWeight: 700 },
      }
    : { value: point.value };

const trendSeries = (config: TrendConfig, width: number) => ({
  // id fixo: na troca de filtro ou de aba a linha se transforma, sem redesenhar.
  id: "trend",
  type: "line",
  name: config.seriesName,
  data: config.points.map((point, index) => trendPoint(config, point, index)),

  // Com o padrão "auto", o ECharts só desenha as bolinhas dos anos com rótulo
  // no eixo e o ano escolhido (14 px) sumia no celular.
  showAllSymbol: true,
  symbol: "circle",
  symbolSize: 8,

  // Contorno branco: a bolinha se destaca da linha e da área.
  itemStyle: { color: ACCENT, borderColor: "#ffffff", borderWidth: 1.5 },

  // Linha sólida: no Power BI é pontilhada, mas tracejado lê como estimativa
  // ou projeção, e aqui todos os anos são dados observados.
  lineStyle: { color: ACCENT, width: 2.5, cap: "round", join: "round" },
  areaStyle: { color: ACCENT, opacity: 0.08 },
  emphasis: { scale: 1.5, focus: "none" },
  label: trendLabel(config, width),
  labelLayout: { hideOverlap: true },
});

// A 360 px, 3 anos (~35 px) não cabem um rótulo de 4 dígitos com folga e
// "2011 2014 2017" se colavam; 4 anos dão ~46 px.
const COMPACT_LABEL_STEP = 4;

// Fora do celular, o menor passo que dá YEAR_LABEL_WIDTH a cada ano exibido
// (todos, quando cabem), para os rótulos não se colarem ("20102011").
const axisLabelStep = (width: number, count: number) =>
  isCompactChart(width)
    ? COMPACT_LABEL_STEP
    : Math.ceil(YEAR_LABEL_WIDTH / plotSlot(width, count));

// Um ano a cada `step` contado do fim, para o mais recente sempre ter rótulo; o
// escolhido também aparece, e os a menos de um passo dele somem para não sobrepor.
const axisLabelInterval =
  (count: number, selectedIndex: number, step: number) => (index: number) => {
    if (index === selectedIndex) return true;
    const nearSelected =
      selectedIndex >= 0 && Math.abs(index - selectedIndex) < step;

    return (count - 1 - index) % step === 0 && !nearSelected;
  };

const trendAxes = (config: TrendConfig, width: number) => ({
  xAxis: {
    type: "category",
    data: config.points.map((point) => point.label),
    axisLine: { lineStyle: { color: AXIS_COLOR } },
    axisLabel: {
      fontSize: FONT_SIZE,
      color: MUTED_COLOR,
      interval: axisLabelInterval(
        config.points.length,
        config.selectedIndex,
        axisLabelStep(width, config.points.length),
      ),
    },
    axisTick: { show: false },
  },
  yAxis: {
    type: "value",

    // Poucas faixas bastam: os valores exatos estão nos rótulos e no balão.
    splitNumber: 2,
    splitLine: { lineStyle: { color: GRID_COLOR, width: 1 } },
    axisLabel: {
      // Evita que o rótulo do primeiro ano encoste nos valores do eixo.
      margin: isCompactChart(width) ? 8 : 40,
      fontSize: FONT_SIZE,
      color: MUTED_COLOR,
      formatter: config.formatAxis,
    },
  },
});

const trendTooltip =
  (config: TrendConfig) =>
  (params: { dataIndex: number }[] | { dataIndex: number }) => {
    const [hovered] = Array.isArray(params) ? params : [params];
    const point = hovered ? config.points[hovered.dataIndex] : undefined;

    if (!point) return "";
    const change = describeYearChange(config.points, hovered.dataIndex);

    return tooltipHtml(
      point.label,
      config.formatValue(point.value),
      change ? [formatYearChange(change)] : [],
    );
  };

export const buildTrendOption = (
  config: TrendConfig,
  width: number,
): ChartOption => {
  const compact = isCompactChart(width);

  return {
    ...baseOption(),
    grid: {
      left: 8,

      // Folga à direita para o rótulo do último ano; no celular não há rótulo.
      right: width < PHONE_CHART_WIDTH ? 16 : compact ? 56 : 48,
      top: 36,
      bottom: 8,
      containLabel: true,
    },
    tooltip: {
      ...TOOLTIP_BASE,
      trigger: "axis",
      axisPointer: {
        type: "line",
        lineStyle: { color: "#bebbbd", width: 1, type: "solid" },
      },
      formatter: trendTooltip(config),
    },
    ...trendAxes(config, width),
    series: [trendSeries(config, width)],
  };
};
