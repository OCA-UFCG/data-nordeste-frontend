import { buildZeroAxis, type ZeroAxis } from "@/features/panels/zeroAxis";
import { pibBarUnit, type PibBarUnit } from "@/features/panels/pib/pibBars";
import { formatPibAxis } from "@/features/panels/pib/pibFormat";
import type { PibYearPoint } from "@/features/panels/pib/pibPanel";

// Cada série tem o seu card desde 26/11/2026: no mesmo gráfico, o PIB total
// (bilhões ou trilhões) e o per capita (mil) precisavam de dois eixos, e a
// diferença de grandeza atrapalhava a leitura.
export type PibLineKey = "pib" | "perCapita";

export type PibLinePoint = { x: number; y: number; value: number };

// Rótulo do valor no ano escolhido, acima do ponto.
export type PibLineLabel = PibLinePoint & { anchor: "middle" | "end" };

export type PibLineTick = { y: number; value: number };

export type PibLineGeometry = {
  width: number;
  height: number;
  narrow: boolean;
  margin: { left: number; right: number; top: number; bottom: number };
  ticks: PibLineTick[];
  years: { year: number; x: number; show: boolean; selected: boolean }[];
  selectedX: number | null;
  points: PibLinePoint[];
  label: PibLineLabel | null;
};

// Medidas do protótipo (`drawLine`): abaixo de 560 px o gráfico encolhe.
// PibLineChart.tsx repete os dois em classes Tailwind (literais); um teste
// garante que batem.
export const PIB_LINE_NARROW_WIDTH = 560;
export const PIB_LINE_HEIGHT = { narrow: 320, wide: 360 } as const;
const MIN_WIDTH = 300;
const ZERO_AXIS_STEPS = 4;

// Título do eixo (a unidade) na faixa acima do gráfico; o rótulo do ano
// escolhido sobe até 12 px acima do ponto mais alto e fica abaixo dele.
export const PIB_LINE_TITLE_Y = 14;
const MARGIN_TOP = 44;
const MARGIN_BOTTOM = 34;
const LABEL_ABOVE = -12;

// Margem da esquerda pelo maior rótulo do eixo, a 0,7 em por caractere em
// 11,5 px: o dígito mais largo do Inter mede 0,65 em ("1.600" dá 29 px
// medidos). A da direita segura metade do último ano, centrado na borda.
const TICK_GAP = 8;
const TICK_CHAR_WIDTH = 0.7 * 11.5;
const MIN_SIDE = 20;

// "2023" em negrito mede 30 px: anos mais próximos que isso se encostam.
const YEAR_CLEARANCE = 36;

const leftMargin = (labels: string[]) =>
  Math.max(
    MIN_SIDE,
    Math.ceil(
      TICK_GAP +
        TICK_CHAR_WIDTH * Math.max(...labels.map((label) => label.length)),
    ),
  );

const frameFor = (width: number, tickLabels: string[]) => {
  const narrow = width < PIB_LINE_NARROW_WIDTH;

  return {
    narrow,
    height: narrow ? PIB_LINE_HEIGHT.narrow : PIB_LINE_HEIGHT.wide,
    margin: {
      left: leftMargin(tickLabels),
      right: MIN_SIDE,
      top: MARGIN_TOP,
      bottom: MARGIN_BOTTOM,
    },
  };
};

type Frame = ReturnType<typeof frameFor>;

type Scale = (value: number) => number;

const xScale = (width: number, { margin }: Frame, count: number): Scale => {
  const innerWidth = width - margin.left - margin.right;

  return (index) =>
    margin.left +
    (count > 1 ? (innerWidth * index) / (count - 1) : innerWidth / 2);
};

const yScale = ({ margin, height }: Frame, axis: ZeroAxis): Scale => {
  const innerHeight = height - margin.top - margin.bottom;

  return (value) => margin.top + innerHeight * (1 - value / axis.max);
};

// O rótulo dos dois últimos anos encosta à esquerda do ponto, para não sair
// do gráfico; os demais ficam centrados, sem passar do eixo da esquerda.
const labelFor = (
  points: PibLinePoint[],
  selectedIndex: number,
  minX: number,
): PibLineLabel => {
  const point = points[selectedIndex];
  const late = selectedIndex >= points.length - 2;

  return {
    value: point.value,
    x: late ? point.x - 4 : Math.max(point.x, minX),
    y: point.y + LABEL_ABOVE,
    anchor: late ? "end" : "middle",
  };
};

// Quantos anos pular entre rótulos para eles não se encostarem. A contagem
// parte do último ano, que sempre aparece.
const yearStride = (xs: number[]) =>
  xs.length > 1 ? Math.max(1, Math.ceil(YEAR_CLEARANCE / (xs[1] - xs[0]))) : 1;

// O ano escolhido sempre aparece; some o vizinho que encostaria nele.
const yearShown = (index: number, xs: number[], selectedIndex: number) => {
  if (index === selectedIndex) return true;
  if ((xs.length - 1 - index) % yearStride(xs) !== 0) return false;

  return (
    selectedIndex < 0 ||
    Math.abs(xs[index] - xs[selectedIndex]) >= YEAR_CLEARANCE
  );
};

// PIB total em bilhões, como pede a equipe de conteúdo; abaixo de R$ 1 bi
// (municípios pequenos) a unidade desce, senão o eixo sairia todo em "0,0x".
const PIB_MAX_UNIT = 1e9;

const pickValue = (key: PibLineKey) => (point: PibYearPoint) =>
  key === "pib" ? point.pib : point.perCapita;

/**
 * Unidade do eixo de cada série: o PIB total em bilhões (ou menos, se a série
 * não chega a R$ 1 bi) e o per capita sempre em R$ mil.
 *
 * @example pibLineUnits(serie).pib // { divisor: 1e9, label: "bilhões" }
 */
export const pibLineUnits = (
  serie: readonly PibYearPoint[],
): Record<PibLineKey, PibBarUnit> => ({
  pib: pibBarUnit(
    Math.min(Math.max(1e3, ...serie.map((point) => point.pib)), PIB_MAX_UNIT),
  ),
  perCapita: pibBarUnit(1e3),
});

const assertSelectedIndex = (
  serie: readonly PibYearPoint[],
  selectedIndex: number,
) => {
  if (selectedIndex === -1 || serie[selectedIndex]) return;
  throw new Error(
    `buildPibLineGeometry got selectedIndex ${selectedIndex} for a series of ${serie.length} years; expected an index inside the series or -1.`,
  );
};

// Série toda zerada: o eixo vai a 4 unidades, senão cada rótulo sairia "0".
const axisFor = (values: number[], unit: PibBarUnit) =>
  buildZeroAxis(Math.max(...values) || ZERO_AXIS_STEPS * unit.divisor);

/**
 * Geometria de um gráfico de linha do PIB (`key`: o PIB total ou o per
 * capita), com um eixo só, a partir de zero, e as medidas do protótipo.
 * `serie` precisa de ao menos um ano.
 *
 * `selectedIndex` -1: o ano filtrado não está na série, e nenhum ano fica
 * destacado nem leva rótulo.
 *
 * @example buildPibLineGeometry({ width: 600, serie, key: "pib", selectedIndex: 13 }).ticks[4].value // 1.6e12
 */
export const buildPibLineGeometry = ({
  width: availableWidth,
  serie,
  key,
  selectedIndex,
}: {
  width: number;
  serie: readonly PibYearPoint[];
  key: PibLineKey;
  selectedIndex: number;
}): PibLineGeometry => {
  assertSelectedIndex(serie, selectedIndex);
  const width = Math.max(MIN_WIDTH, availableWidth);
  const values = serie.map(pickValue(key));
  const unit = pibLineUnits(serie)[key];
  const axis = axisFor(values, unit);
  const frame = frameFor(
    width,
    axis.ticks.map((tick) => formatPibAxis(tick, unit)),
  );
  const x = xScale(width, frame, serie.length);
  const y = yScale(frame, axis);
  const xs = serie.map((_, index) => x(index));
  const points = values.map((value, index) => ({
    value,
    x: xs[index],
    y: y(value),
  }));

  return {
    width,
    height: frame.height,
    narrow: frame.narrow,
    margin: frame.margin,
    ticks: axis.ticks.map((value) => ({ y: y(value), value })),
    years: serie.map((point, index) => ({
      year: point.ano,
      x: xs[index],
      show: yearShown(index, xs, selectedIndex),
      selected: index === selectedIndex,
    })),
    selectedX: selectedIndex < 0 ? null : xs[selectedIndex],
    points,
    label:
      selectedIndex < 0
        ? null
        : labelFor(points, selectedIndex, frame.margin.left + 44),
  };
};

/**
 * Subtítulo dos cards de linha: lugar e anos que a série realmente tem. A
 * série já está no título do card.
 *
 * @example pibLineSubtitle("Nordeste · Piauí", [2010, 2023]) // "Nordeste · Piauí · 2010 a 2023"
 */
export const pibLineSubtitle = (place: string, years: number[]): string =>
  years.length ? `${place} · ${years[0]} a ${years[years.length - 1]}` : place;
