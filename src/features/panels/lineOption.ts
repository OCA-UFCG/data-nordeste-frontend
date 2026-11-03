import {
  AXIS_COLOR,
  baseOption,
  FONT_SIZE,
  GRID_COLOR,
  isCompactChart,
  MUTED_COLOR,
  TEXT_COLOR,
  TOOLTIP_BASE,
} from "@/features/panels/chartBase";
import type {
  ColumnConfig,
  ColumnSeries,
} from "@/features/panels/chartOptions";
import {
  axisLabelInterval,
  plotSlot,
  trendLabelIndexes,
  YEAR_LABEL_WIDTH,
} from "@/features/panels/trendOption";
import type { ChartOption } from "@/lib/echarts";

export type LineConfig = ColumnConfig & { selectedIndex: number };

// ponytail: larguras estimadas a 14 px ("0,675" com folga; eixo Y "0,700" e
// margens); medir o texto no canvas se a fonte ou o formato mudarem.
const LABEL_SLOT_WIDTH = 52;
const PLOT_CHROME_WIDTH = 100;

/**
 * Pontos com rótulo de valor: todos, quando cada ano tem espaço para o seu; senão
 * o ano escolhido e as pontas (como no PIB; no celular, sem a primeira), e os
 * demais ficam no balão.
 *
 * @example lineLabelIndexes(10, 5, 300) // Set {5, 9}
 */
export const lineLabelIndexes = (
  count: number,
  selectedIndex: number,
  width: number,
): Set<number> => {
  const slot = plotSlot(width, count, PLOT_CHROME_WIDTH);

  if (slot >= LABEL_SLOT_WIDTH)
    return new Set(Array.from({ length: count }, (_, i) => i));

  const indexes = trendLabelIndexes(
    count,
    selectedIndex,
    Math.ceil(LABEL_SLOT_WIDTH / slot),
  );

  // O primeiro ponto fica sobre o eixo Y: no celular, o rótulo dele invadia os
  // valores do eixo.
  if (isCompactChart(width) && selectedIndex !== 0) indexes.delete(0);

  return indexes;
};

/**
 * Anos com rótulo no eixo X: os do passo do PIB (contados do fim) e também o
 * primeiro, para ficar claro onde a série começa; os anos a menos de um passo
 * dele ou do escolhido somem para não se colarem.
 *
 * @example lineYearVisible(10, 9, 2)(0) // true: 2012 aparece mesmo fora do passo
 */
export const lineYearVisible = (
  count: number,
  selectedIndex: number,
  step: number,
): ((index: number) => boolean) => {
  const fromEnd = axisLabelInterval(count, selectedIndex, step);

  return (index) => {
    if (index === selectedIndex) return true;
    if (index === 0) return selectedIndex < 0 || selectedIndex >= step;

    return index >= step && fromEnd(index);
  };
};

const linePoint = (value: number, selected: boolean) =>
  selected
    ? {
        value,
        symbolSize: 13,
        itemStyle: { borderWidth: 2 },
        label: { color: TEXT_COLOR, fontWeight: 700 },
      }
    : { value };

const lineSeries = (
  series: ColumnSeries,
  config: LineConfig,
  labeled: Set<number>,
) => ({
  id: series.name,
  type: "line",
  name: series.name,
  data: series.values.map((value, index) =>
    linePoint(value, index === config.selectedIndex),
  ),
  symbol: "circle",
  symbolSize: 7,
  showAllSymbol: true,
  itemStyle: { color: series.color, borderColor: "#ffffff", borderWidth: 1 },

  // Linha sólida, como no PIB: no Power BI é tracejada, mas tracejado lê como
  // estimativa ou projeção, e aqui todos os anos são dados observados.
  lineStyle: { color: series.color, width: 2.5 },
  label: {
    show: true,
    position: "top",
    distance: 8,
    fontSize: FONT_SIZE,
    color: MUTED_COLOR,
    textBorderColor: "#ffffff",
    textBorderWidth: 3,
    formatter: ({ value, dataIndex }: { value: number; dataIndex: number }) =>
      labeled.has(dataIndex) ? config.formatLabel(value) : "",
  },
  labelLayout: { hideOverlap: true },
  emphasis: { focus: "series" },
});

const lineAxes = (config: LineConfig, width: number) => ({
  xAxis: {
    type: "category",
    data: config.categories,
    boundaryGap: false,
    axisTick: { show: false },
    axisLine: { lineStyle: { color: AXIS_COLOR } },
    splitLine: { show: true, lineStyle: { color: GRID_COLOR } },
    axisLabel: {
      fontSize: FONT_SIZE,
      color: TEXT_COLOR,
      interval: lineYearVisible(
        config.categories.length,
        config.selectedIndex,
        Math.ceil(
          YEAR_LABEL_WIDTH /
            plotSlot(width, config.categories.length, PLOT_CHROME_WIDTH),
        ),
      ),
    },
  },
  yAxis: {
    type: "value",
    scale: true,
    splitNumber: isCompactChart(width) ? 2 : 3,
    splitLine: { lineStyle: { color: AXIS_COLOR, type: "dashed" } },
    axisLabel: {
      // Folga para o rótulo do primeiro ano, que fica sobre o eixo.
      margin: 28,
      fontSize: FONT_SIZE,
      color: MUTED_COLOR,
      formatter: config.formatValue,
    },
  },
});

/**
 * Linhas com marcador, legenda no topo e o ano escolhido em destaque: o gráfico
 * de linhas do Power BI, sem rolagem no celular.
 *
 * @example buildLineOption({ categories: ["2020", "2021"], series: [{ name: "IDH", color: "#7C46E1", values: [0.7, 0.71] }], selectedIndex: 1, formatLabel: String, formatValue: String }, 640)
 */
export const buildLineOption = (
  config: LineConfig,
  width: number,
): ChartOption => {
  const labeled = lineLabelIndexes(
    config.categories.length,
    config.selectedIndex,
    width,
  );

  return {
    ...baseOption(),
    legend: {
      top: 0,
      left: 0,
      icon: "circle",
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: FONT_SIZE, color: TEXT_COLOR },
    },
    grid: { left: 8, right: 24, top: 48, bottom: 8, containLabel: true },
    tooltip: {
      ...TOOLTIP_BASE,
      trigger: "axis",
      axisPointer: {
        type: "line",
        lineStyle: { color: "#bebbbd", width: 1, type: "solid" },
      },
      valueFormatter: config.formatValue,
    },
    ...lineAxes(config, width),
    series: config.series.map((series) => lineSeries(series, config, labeled)),
  };
};
