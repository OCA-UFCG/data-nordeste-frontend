import { buildZeroAxis, type ZeroAxis } from "@/features/panels/zeroAxis";
import { pibBarUnit, type PibBarUnit } from "@/features/panels/pib/pibBars";
import { formatPibAxis } from "@/features/panels/pib/pibFormat";
import type { PibYearPoint } from "@/features/panels/pib/pibPanel";

export type PibLineKey = "pib" | "perCapita";

export type PibLinePoint = { x: number; y: number; value: number };

// Rótulo do valor no ano escolhido, um por série.
export type PibLineLabel = PibLinePoint & { anchor: "middle" | "end" };

export type PibLineTick = { y: number; pib: number; perCapita: number };

// Título do eixo; no celular, linha do cabeçalho com marcador da série.
export type PibLineTitle = { x: number; y: number; anchor: "start" | "end" };

// Valor do ano escolhido no cabeçalho do celular, alinhado à direita.
export type PibLineReadout = { x: number; y: number; value: number };

export type PibLineGeometry = {
  width: number;
  height: number;
  narrow: boolean;
  margin: { left: number; right: number; top: number; bottom: number };
  titles: Record<PibLineKey, PibLineTitle>;
  ticks: PibLineTick[];
  years: { year: number; x: number; show: boolean; selected: boolean }[];
  selectedX: number | null;
  points: Record<PibLineKey, PibLinePoint[]>;
  labels: Record<PibLineKey, PibLineLabel> | null;
  readouts: Record<PibLineKey, PibLineReadout> | null;
};

// Medidas do protótipo (`drawLine`): abaixo de 560 px o gráfico encolhe e
// mostra um ano a cada quatro. PibLineChart.tsx repete os dois em classes
// Tailwind (literais); um teste garante que batem.
export const PIB_LINE_NARROW_WIDTH = 560;
export const PIB_LINE_HEIGHT = { narrow: 320, wide: 360 } as const;
const MIN_WIDTH = 300;

// O eixo do per capita sobra 40% acima do maior valor: a linha dele fica
// abaixo da do PIB total em vez de as duas se sobreporem.
const PER_CAPITA_HEADROOM = 1.4;
const ZERO_AXIS_STEPS = 4;

// Rótulo acima do ponto (-12) ou abaixo dele; nos dois últimos anos o de
// baixo desce mais, porque fica à esquerda do ponto e cruzaria a linha.
const LABEL_ABOVE = -12;
const LABEL_BELOW = 22;
const LABEL_BELOW_LATE = 36;

// Título de cada eixo, na faixa acima do gráfico (margin.top) e acima dos
// rótulos de valor do ano escolhido.
const TITLE_Y = 14;

// Abaixo de 560 px os dois títulos não cabem lado a lado (~250 px em Inter
// 12 semibold): viram duas linhas à esquerda, com o marcador da série antes
// (MARKER_SPACE) e o valor do ano escolhido à direita, em vez de rótulos
// sobre as linhas.
const NARROW_TITLE_Y = { pib: 14, perCapita: 32 } as const;
export const PIB_LINE_MARKER_SPACE = 18;
const NARROW_TOP = 50;

// Margem lateral do celular pelo maior rótulo do eixo, a 0,7 em por
// caractere em 11,5 px: o dígito mais largo do Inter mede 0,65 em ("1.600"
// dá 29 px medidos). O mínimo segura o ano do último ponto, centrado na
// borda do gráfico.
const TICK_GAP = 8;
const TICK_CHAR_WIDTH = 0.7 * 11.5;
const NARROW_MIN_SIDE = 20;

const narrowSide = (labels: string[]) =>
  Math.max(
    NARROW_MIN_SIDE,
    Math.ceil(
      TICK_GAP +
        TICK_CHAR_WIDTH * Math.max(...labels.map((label) => label.length)),
    ),
  );

type AxisLabels = Record<PibLineKey, string[]>;

const frameFor = (width: number, axisLabels: AxisLabels) => {
  const narrow = width < PIB_LINE_NARROW_WIDTH;

  return {
    narrow,
    height: narrow ? PIB_LINE_HEIGHT.narrow : PIB_LINE_HEIGHT.wide,
    margin: narrow
      ? {
          left: narrowSide(axisLabels.pib),
          right: narrowSide(axisLabels.perCapita),
          top: NARROW_TOP,
          bottom: 34,
        }
      : { left: 72, right: 72, top: 44, bottom: 34 },
  };
};

type Frame = ReturnType<typeof frameFor>;

const axisLabels = (axis: ZeroAxis, unit: PibBarUnit) =>
  axis.ticks.map((tick) => formatPibAxis(tick, unit));

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

const titlesFor = (
  width: number,
  narrow: boolean,
): Record<PibLineKey, PibLineTitle> =>
  narrow
    ? {
        pib: {
          x: PIB_LINE_MARKER_SPACE,
          y: NARROW_TITLE_Y.pib,
          anchor: "start",
        },
        perCapita: {
          x: PIB_LINE_MARKER_SPACE,
          y: NARROW_TITLE_Y.perCapita,
          anchor: "start",
        },
      }
    : {
        pib: { x: 0, y: TITLE_Y, anchor: "start" },
        perCapita: { x: width, y: TITLE_Y, anchor: "end" },
      };

const readoutsFor = (
  width: number,
  serie: readonly PibYearPoint[],
  selectedIndex: number,
): Record<PibLineKey, PibLineReadout> => ({
  pib: { x: width, y: NARROW_TITLE_Y.pib, value: serie[selectedIndex].pib },
  perCapita: {
    x: width,
    y: NARROW_TITLE_Y.perCapita,
    value: serie[selectedIndex].perCapita,
  },
});

// No celular sai um ano a cada quatro, mais o escolhido: o valor dele fica
// no cabeçalho, então o eixo precisa dizer de que ano é. Some o ano vizinho
// que encostaria nele ("2023" bold mede 30 px).
const YEAR_CLEARANCE = 36;

const yearShown = (
  index: number,
  xs: number[],
  selectedIndex: number,
  narrow: boolean,
) => {
  if (!narrow || index === selectedIndex) return true;
  if (index % 4 !== 1) return false;

  return (
    selectedIndex < 0 ||
    Math.abs(xs[index] - xs[selectedIndex]) >= YEAR_CLEARANCE
  );
};

// PIB total em bilhões, como pede a equipe de conteúdo; abaixo de R$ 1 bi
// (municípios pequenos) a unidade desce, senão o eixo sairia todo em "0,0x".
const PIB_MAX_UNIT = 1e9;

/**
 * Unidade de cada eixo do gráfico de linha: o PIB total em bilhões (ou
 * menos, se a série não chega a R$ 1 bi) e o per capita sempre em R$ mil.
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

/**
 * Geometria do gráfico "Dinâmica temporal do PIB": duas linhas, cada uma com o
 * seu eixo (PIB total à esquerda, per capita à direita), com as medidas do
 * protótipo. `serie` precisa de ao menos um ano.
 *
 * `selectedIndex` -1: o ano filtrado não está na série, e nenhum ano fica
 * destacado nem leva rótulo. Abaixo de 560 px os títulos dos eixos e o valor
 * do ano escolhido viram um cabeçalho de duas linhas (`readouts` no lugar
 * de `labels`).
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
  if (selectedIndex !== -1 && !serie[selectedIndex]) {
    throw new Error(
      `buildPibLineGeometry got selectedIndex ${selectedIndex} for a series of ${serie.length} years; expected an index inside the series or -1.`,
    );
  }
  const width = Math.max(MIN_WIDTH, availableWidth);
  const pib = serie.map((point) => point.pib);
  const perCapita = serie.map((point) => point.perCapita);
  const units = pibLineUnits(serie);

  // Série toda zerada: o eixo vai a 4 unidades, senão cada rótulo sairia "0".
  const pibAxis = buildZeroAxis(
    Math.max(...pib) || ZERO_AXIS_STEPS * units.pib.divisor,
  );
  const perCapitaAxis = buildZeroAxis(
    Math.max(...perCapita) * PER_CAPITA_HEADROOM ||
      ZERO_AXIS_STEPS * units.perCapita.divisor,
  );
  const frame = frameFor(width, {
    pib: axisLabels(pibAxis, units.pib),
    perCapita: axisLabels(perCapitaAxis, units.perCapita),
  });
  const x = xScale(width, frame, serie.length);
  const xs = serie.map((_, index) => x(index));
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
    titles: titlesFor(width, frame.narrow),
    ticks: pibAxis.ticks.map((value, index) => ({
      y: yPib(value),
      pib: value,
      perCapita: perCapitaAxis.ticks[index],
    })),
    years: serie.map((point, index) => ({
      year: point.ano,
      x: xs[index],
      show: yearShown(index, xs, selectedIndex, frame.narrow),
      selected: index === selectedIndex,
    })),
    selectedX: selectedIndex < 0 ? null : x(selectedIndex),
    points,
    labels:
      selectedIndex < 0 || frame.narrow
        ? null
        : buildLabels(points, selectedIndex, frame.margin.left + 44),
    readouts:
      selectedIndex < 0 || !frame.narrow
        ? null
        : readoutsFor(width, serie, selectedIndex),
  };
};

/**
 * Subtítulo do card de linha: lugar e anos que a série realmente tem. As
 * séries já estão no título do card.
 *
 * @example pibLineSubtitle("Nordeste · Piauí", [2010, 2023]) // "Nordeste · Piauí · 2010 a 2023"
 */
export const pibLineSubtitle = (place: string, years: number[]): string =>
  years.length ? `${place} · ${years[0]} a ${years[years.length - 1]}` : place;
