import { stepCategory } from "@/features/panels/lineInteraction";

const ARROW_KEYS = { ArrowLeft: true, ArrowRight: true };

export type IdhLineSeries = {
  key: string;
  values: readonly number[];

  // Deslocamento vertical do rótulo do valor: acima da linha de cima (-10) e
  // abaixo da de baixo (+18), para os dois não se cruzarem.
  labelOffset: number;
};

export type IdhLinePoint = { x: number; y: number; value: number };

export type IdhLineLabel = IdhLinePoint & {
  index: number;
  anchor: "start" | "middle" | "end";
};

export type IdhLineGeometry = {
  width: number;
  height: number;
  margin: { left: number; right: number; top: number; bottom: number };
  ticks: { value: number; y: number }[];
  years: { year: number; x: number; show: boolean; selected: boolean }[];

  // Null quando o ano filtrado não está na série: nada fica destacado.
  selectedX: number | null;
  points: Record<string, IdhLinePoint[]>;
  labels: Record<string, IdhLineLabel[]>;
};

// Medidas do protótipo: abaixo de 520 px o gráfico encolhe e mostra um ano a
// cada três.
const NARROW_WIDTH = 520;
const MIN_WIDTH = 280;

const frameFor = (width: number) => {
  const narrow = width < NARROW_WIDTH;

  return {
    narrow,
    height: narrow ? 280 : 320,
    margin: {
      left: narrow ? 44 : 54,
      right: narrow ? 18 : 26,
      top: 22,
      bottom: 32,
    },
  };
};

// 0,4 a 0,8 como no protótipo; só cresce se um valor real sair dessa faixa.
const axisRange = (series: readonly IdhLineSeries[]) => {
  const values = series.flatMap((item) => [...item.values]);
  const low = Math.min(0.4, Math.floor(Math.min(...values) * 10) / 10);
  const high = Math.max(0.8, Math.ceil(Math.max(...values) * 10) / 10);

  return { low, high };
};

const tickValues = ({ low, high }: { low: number; high: number }) =>
  Array.from(
    { length: Math.round((high - low) * 10) + 1 },
    (_, index) => Math.round((low + index / 10) * 10) / 10,
  );

const labelAnchor = (index: number, last: number) => {
  if (index === 0) return "start";
  if (index === last) return "end";

  return "middle";
};

type Scales = { x: (index: number) => number; y: (value: number) => number };

// Primeiro, escolhido e último ano: os rótulos fixos do protótipo.
const seriesLabels = (
  series: IdhLineSeries,
  scales: Scales,
  selectedIndex: number,
): IdhLineLabel[] => {
  const last = series.values.length - 1;
  const indexes = [...new Set([0, selectedIndex, last])]
    .filter((index) => index >= 0)
    .sort((a, b) => a - b);

  return indexes.map((index) => ({
    index,
    value: series.values[index],
    anchor: labelAnchor(index, last),
    x: scales.x(index) + (index === 0 || index === last ? 4 : 0),
    y: scales.y(series.values[index]) + series.labelOffset,
  }));
};

const buildScales = (
  width: number,
  frame: ReturnType<typeof frameFor>,
  count: number,
  range: { low: number; high: number },
): Scales => {
  const { margin, height } = frame;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  return {
    x: (index) =>
      margin.left +
      (count > 1 ? (innerWidth * index) / (count - 1) : innerWidth / 2),
    y: (value) =>
      margin.top +
      innerHeight * (1 - (value - range.low) / (range.high - range.low)),
  };
};

const byKey = <Value>(
  series: readonly IdhLineSeries[],
  build: (item: IdhLineSeries) => Value,
): Record<string, Value> =>
  Object.fromEntries(series.map((item) => [item.key, build(item)]));

/**
 * Geometria do gráfico de linhas do painel de IDH, com as medidas do
 * protótipo: margens, escala, anos no eixo e os rótulos de valor.
 *
 * `selectedIndex` -1: o ano filtrado não está na série (lacuna na carga), e
 * nenhum ano fica destacado.
 *
 * @example buildIdhLineGeometry({ width: 800, years, series, selectedIndex: 9 }).points.idh[0]
 */
export const buildIdhLineGeometry = ({
  width: availableWidth,
  years,
  series,
  selectedIndex,
}: {
  width: number;
  years: readonly number[];
  series: readonly IdhLineSeries[];
  selectedIndex: number;
}): IdhLineGeometry => {
  const width = Math.max(MIN_WIDTH, availableWidth);
  const frame = frameFor(width);
  const range = axisRange(series);
  const scales = buildScales(width, frame, years.length, range);

  return {
    width,
    height: frame.height,
    margin: frame.margin,
    ticks: tickValues(range).map((value) => ({ value, y: scales.y(value) })),
    years: years.map((year, index) => ({
      year,
      x: scales.x(index),
      show: !frame.narrow || index % 3 === 0,
      selected: index === selectedIndex,
    })),
    selectedX: selectedIndex < 0 ? null : scales.x(selectedIndex),
    points: byKey(series, (item) =>
      item.values.map((value, index) => ({
        value,
        x: scales.x(index),
        y: scales.y(value),
      })),
    ),
    labels: byKey(series, (item) => seriesLabels(item, scales, selectedIndex)),
  };
};

/**
 * Caminho SVG de uma linha a partir dos pontos.
 *
 * @example linePath([{ x: 0, y: 10, value: 0.7 }, { x: 5, y: 8, value: 0.71 }]) // "M0.0 10.0L5.0 8.0"
 */
export const linePath = (points: readonly IdhLinePoint[]): string =>
  points
    .map(
      ({ x, y }, index) =>
        `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`,
    )
    .join("");

const nearestYear = (years: readonly number[], ano: number, key: string) => {
  if (key === "ArrowLeft") return years.filter((year) => year < ano).at(-1);
  if (key === "ArrowRight") return years.find((year) => year > ano);

  return undefined;
};

/**
 * Ano para onde uma tecla leva no gráfico. Quando o ano filtrado não está na
 * série, as setas vão ao ano vizinho mais próximo em vez de se perderem.
 *
 * @example stepIdhYear([2019, 2021], 2020, "ArrowLeft") // 2019
 */
export const stepIdhYear = (
  years: readonly number[],
  ano: number,
  key: string,
): number | null => {
  if (!years.includes(ano) && key in ARROW_KEYS) {
    return nearestYear(years, ano, key) ?? null;
  }
  const next = stepCategory(years.map(String), String(ano), key);

  return next === null ? null : Number(next);
};
