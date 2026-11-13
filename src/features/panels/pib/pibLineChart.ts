import { buildZeroAxis } from "@/features/panels/pib/pibAxis";
import type { PibYearPoint } from "@/features/panels/pib/pibPanel";

export type PibLineKey = "pib" | "perCapita";

export type PibLinePoint = { x: number; y: number; value: number };

// Rótulo do valor no ano escolhido, um por série.
export type PibLineLabel = PibLinePoint & { anchor: "middle" | "end" };

export type PibLineTick = { y: number; pib: number; perCapita: number };

export type PibLineGeometry = {
  width: number;
  height: number;
  narrow: boolean;
  margin: { left: number; right: number; top: number; bottom: number };
  ticks: PibLineTick[];
  years: { year: number; x: number; show: boolean; selected: boolean }[];
  selectedX: number;
  points: Record<PibLineKey, PibLinePoint[]>;
  labels: Record<PibLineKey, PibLineLabel>;
};

// Medidas do protótipo (`drawLine`): abaixo de 560 px o gráfico encolhe e
// mostra um ano a cada quatro.
const NARROW_WIDTH = 560;
const MIN_WIDTH = 300;

// O eixo do per capita sobra 40% acima do maior valor: a linha dele fica
// abaixo da do PIB total em vez de as duas se sobreporem.
const PER_CAPITA_HEADROOM = 1.4;

// Rótulo acima do ponto (-12) ou abaixo dele; nos dois últimos anos o de
// baixo desce mais, porque fica à esquerda do ponto e cruzaria a linha.
const LABEL_ABOVE = -12;
const LABEL_BELOW = 22;
const LABEL_BELOW_LATE = 36;

const frameFor = (width: number) => {
  const narrow = width < NARROW_WIDTH;

  return {
    narrow,
    height: narrow ? 300 : 340,
    margin: {
      left: narrow ? 56 : 72,
      right: narrow ? 52 : 72,
      top: 22,
      bottom: 34,
    },
  };
};

type Frame = ReturnType<typeof frameFor>;

type Scale = (value: number) => number;

const innerSize = (width: number, { margin, height }: Frame) => ({
  innerWidth: width - margin.left - margin.right,
  innerHeight: height - margin.top - margin.bottom,
});

const xScale = (width: number, frame: Frame, count: number): Scale => {
  const { innerWidth } = innerSize(width, frame);

  return (index) =>
    frame.margin.left +
    (count > 1 ? (innerWidth * index) / (count - 1) : innerWidth / 2);
};

const yScale = (width: number, frame: Frame, max: number): Scale => {
  const { innerHeight } = innerSize(width, frame);

  return (value) => frame.margin.top + innerHeight * (1 - value / max);
};

const seriesPoints = (values: number[], x: Scale, y: Scale): PibLinePoint[] =>
  values.map((value, index) => ({ value, x: x(index), y: y(value) }));

// O rótulo dos dois últimos anos encosta à esquerda do ponto, para não sair
// do gráfico; os demais ficam centrados, sem passar do eixo da esquerda.
const labelFor = (
  point: PibLinePoint,
  offset: number,
  late: boolean,
  minX: number,
): PibLineLabel => ({
  value: point.value,
  x: late ? point.x - 4 : Math.max(point.x, minX),
  y: point.y + offset,
  anchor: late ? "end" : "middle",
});

// A série que está mais alta no ano escolhido leva o rótulo em cima; a outra,
// embaixo. Assim os dois valores nunca se cruzam.
const buildLabels = (
  points: Record<PibLineKey, PibLinePoint[]>,
  selectedIndex: number,
  minX: number,
): Record<PibLineKey, PibLineLabel> => {
  const pib = points.pib[selectedIndex];
  const perCapita = points.perCapita[selectedIndex];
  const late = selectedIndex >= points.pib.length - 2;
  const below = late ? LABEL_BELOW_LATE : LABEL_BELOW;
  const perCapitaAbove = perCapita.y < pib.y;

  return {
    pib: labelFor(pib, perCapitaAbove ? below : LABEL_ABOVE, late, minX),
    perCapita: labelFor(
      perCapita,
      perCapitaAbove ? LABEL_ABOVE : below,
      late,
      minX,
    ),
  };
};

/**
 * Geometria do gráfico "Evolução anual do PIB": duas linhas, cada uma com o
 * seu eixo (PIB total à esquerda, per capita à direita), com as medidas do
 * protótipo. `serie` precisa de ao menos um ano.
 *
 * @example buildPibLineGeometry({ width: 820, serie, selectedIndex: 13 }).ticks[4].pib // 1.6e12
 */
export const buildPibLineGeometry = ({
  width: availableWidth,
  serie,
  selectedIndex,
}: {
  width: number;
  serie: readonly PibYearPoint[];
  selectedIndex: number;
}): PibLineGeometry => {
  if (!serie[selectedIndex]) {
    throw new Error(
      `buildPibLineGeometry got selectedIndex ${selectedIndex} for a series of ${serie.length} years; expected an index inside the series.`,
    );
  }
  const width = Math.max(MIN_WIDTH, availableWidth);
  const frame = frameFor(width);
  const pib = serie.map((point) => point.pib);
  const perCapita = serie.map((point) => point.perCapita);
  const pibAxis = buildZeroAxis(Math.max(...pib));
  const perCapitaAxis = buildZeroAxis(
    Math.max(...perCapita) * PER_CAPITA_HEADROOM,
  );
  const x = xScale(width, frame, serie.length);
  const yPib = yScale(width, frame, pibAxis.max);
  const points = {
    pib: seriesPoints(pib, x, yPib),
    perCapita: seriesPoints(
      perCapita,
      x,
      yScale(width, frame, perCapitaAxis.max),
    ),
  };

  return {
    width,
    height: frame.height,
    narrow: frame.narrow,
    margin: frame.margin,
    ticks: pibAxis.ticks.map((value, index) => ({
      y: yPib(value),
      pib: value,
      perCapita: perCapitaAxis.ticks[index],
    })),
    years: serie.map((point, index) => ({
      year: point.ano,
      x: x(index),
      show: !frame.narrow || index % 4 === 1,
      selected: index === selectedIndex,
    })),
    selectedX: x(selectedIndex),
    points,
    labels: buildLabels(points, selectedIndex, frame.margin.left + 44),
  };
};
