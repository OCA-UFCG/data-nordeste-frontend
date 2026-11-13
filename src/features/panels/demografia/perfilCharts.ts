import type { ChartPoint } from "@/features/panels/chartBase";
import type { PopulacaoPorFaixa } from "@/features/panels/demografia/demografiaPanel";
import { capitalizeScale, formatNumberCompact } from "@/features/panels/format";
import { linePath } from "@/features/panels/svgPath";

type Axis = { min: number; max: number; ticks: number[] };

const STEP_MANTISSAS = [1, 2, 2.5, 5] as const;

// Folga de 10% em cada lado: o dado não encosta na borda do gráfico.
const HEADROOM = 0.1;

/**
 * Rótulo de pessoas compacto em pt-BR, como os do protótipo ("15 Mi", "69 Mil").
 * Abaixo de mil, sai o inteiro puro.
 *
 * @example formatCompactPeople(14_590_000) // "15 Mi"
 */
export const formatCompactPeople = (value: number): string =>
  capitalizeScale(formatNumberCompact(value, 0));

const paddedRange = (values: number[]): { lo: number; hi: number } => {
  const lo = Math.min(...values);
  const hi = Math.max(...values);

  // Série constante: usa a própria magnitude como vão para não colapsar o eixo.
  const span = hi - lo || Math.abs(hi) || 1;

  return { lo: lo - span * HEADROOM, hi: hi + span * HEADROOM };
};

// Passos de {1,2,2.5,5}×10^k em torno da ordem de grandeza do vão, em ordem crescente.
const niceSteps = (span: number): number[] => {
  const exponent = Math.floor(Math.log10(span));

  return [-2, -1, 0, 1, 2].flatMap((offset) =>
    STEP_MANTISSAS.map((mantissa) => mantissa * 10 ** (exponent + offset)),
  );
};

const cellCount = (lo: number, hi: number, step: number): number =>
  Math.ceil(hi / step) - Math.floor(lo / step);

// Evita ruído de ponto flutuante (ex.: 2.5 × 10^6 × 3) nos rótulos dos ticks.
const exact = (value: number): number => Number(value.toPrecision(12));

/**
 * Eixo com limites redondos e ticks igualmente espaçados que cobrem os dados
 * com folga. Os ticks saem em ordem crescente; quem desenha de cima para
 * baixo deve inverter.
 *
 * @example niceAxis([47_741_711, 53_081_950, 54_658_515]) // { min: 40e6, max: 60e6, ticks: [40e6, 45e6, 50e6, 55e6, 60e6] }
 */
export const niceAxis = (values: number[], intervals = 4): Axis => {
  if (values.length === 0 || intervals < 2) {
    throw new Error(
      `niceAxis needs at least one value and 2 intervals; got ${values.length} values and ${intervals} intervals.`,
    );
  }
  const { lo, hi } = paddedRange(values);
  const step = niceSteps(hi - lo).find(
    (candidate) => cellCount(lo, hi, candidate) <= intervals,
  );

  if (step === undefined) {
    throw new Error(`niceAxis found no step for range ${lo}..${hi}.`);
  }

  // Com passo grande demais o eixo fica com menos divisões: estende para baixo,
  // mas nunca abaixo de zero quando os dados não são negativos (população).
  const extended =
    Math.floor(lo / step) - (intervals - cellCount(lo, hi, step));
  const first = Math.min(...values) >= 0 ? Math.max(0, extended) : extended;
  const ticks = Array.from({ length: intervals + 1 }, (_, i) =>
    exact((first + i) * step),
  );

  return { min: ticks[0], max: ticks[intervals], ticks };
};

export type SerieGeometryInput = {
  width: number;
  points: { ano: number; valor: number }[];
};

export type SerieGeometry = {
  width: number;
  height: number;
  gridLines: { y: number; label: string }[];
  path: string;
  points: {
    x: number;
    y: number;
    label: string;
    ano: number;
    valor: number;
  }[];
  yearLabelY: number;
  axisLabelX: number;
};

type SerieLayout = {
  w: number;
  h: number;
  L: number;
  R: number;
  T: number;
  B: number;
};

// IMPORTANT: largura mínima e a troca de margens em 460px vêm do protótipo;
// mudar aqui desalinha os rótulos do eixo em telas estreitas.
const serieLayout = (width: number): SerieLayout => {
  const w = Math.max(280, width);
  const narrow = w < 460;

  return {
    w,
    h: narrow ? 250 : 290,
    L: narrow ? 48 : 54,
    R: narrow ? 24 : 36,
    T: 26,
    B: 36,
  };
};

// Anos são desigualmente espaçados (2000, 2010, 2022): a posição segue a
// proporção do tempo, não o índice do censo.
const serieScale = (layout: SerieLayout, years: number[], axis: Axis) => {
  const pw = layout.w - layout.L - layout.R;
  const ph = layout.h - layout.T - layout.B;
  const first = Math.min(...years);
  const last = Math.max(...years);
  const share = (ano: number) =>
    last === first ? 0 : (ano - first) / (last - first);

  return {
    x: (ano: number) => layout.L + 26 + share(ano) * (pw - 52),
    y: (valor: number) =>
      layout.T + ((axis.max - valor) / (axis.max - axis.min)) * ph,
  };
};

/**
 * Geometria SVG da série de censos: linhas de grade, pontos e caminho. O
 * eixo vem de niceAxis; desenha de cima (máximo) para baixo.
 *
 * @example buildSerieGeometry({ width: 800, points: [{ ano: 2000, valor: 47_741_711 }] }).height // 290
 */
export const buildSerieGeometry = ({
  width,
  points,
}: SerieGeometryInput): SerieGeometry => {
  const layout = serieLayout(width);
  const axis = niceAxis(points.map((point) => point.valor));
  const scale = serieScale(
    layout,
    points.map((point) => point.ano),
    axis,
  );

  return {
    width: layout.w,
    height: layout.h,
    gridLines: [...axis.ticks].reverse().map((tick) => ({
      y: scale.y(tick),
      label: formatCompactPeople(tick),
    })),
    path: linePath(
      points.map((p) => ({ x: scale.x(p.ano), y: scale.y(p.valor) })),
    ),
    points: points.map((point) => ({
      x: scale.x(point.ano),
      y: scale.y(point.valor),
      label: formatCompactPeople(point.valor),
      ano: point.ano,
      valor: point.valor,
    })),
    yearLabelY: layout.h - 10,
    axisLabelX: layout.L - 8,
  };
};

export type CorRacaInput = ChartPoint;

export type CorRacaBarGeometry = {
  label: string;
  value: number;
  valueLabel: string;
  x: number;
  barX: number;
  barY: number;
  barWidth: number;
  barHeight: number;
};

export type CorRacaGeometry = {
  width: number;
  height: number;
  base: number;
  baseline: { x1: number; x2: number };
  bars: CorRacaBarGeometry[];
};

type CorRacaLayout = {
  w: number;
  h: number;
  pad: number;
  base: number;
  top: number;
};

const corRacaLayout = (width: number): CorRacaLayout => {
  const w = Math.max(260, width);
  const narrow = w < 460;
  const h = narrow ? 250 : 270;

  return { w, h, pad: narrow ? 14 : 30, base: h - 32, top: 26 };
};

type BarScale = { base: number; top: number; max: number; barWidth: number };

const corRacaBar = (
  bar: CorRacaInput,
  x: number,
  scale: BarScale,
): CorRacaBarGeometry => {
  // WARNING: altura mínima de 2px mantém barras com valor pequeno visíveis.
  const barHeight = Math.max(
    2,
    scale.max > 0 ? (bar.value / scale.max) * (scale.base - scale.top) : 0,
  );

  return {
    label: bar.label,
    value: bar.value,
    valueLabel: formatCompactPeople(bar.value),
    x,
    barX: x - scale.barWidth / 2,
    barY: scale.base - barHeight,
    barWidth: scale.barWidth,
    barHeight,
  };
};

/**
 * Geometria SVG das colunas de cor ou raça. A maior barra chega ao topo
 * (26px) e nenhuma fica abaixo de 2px.
 *
 * @example buildCorRacaGeometry({ width: 600, bars: [{ label: "Parda", value: 32_580_000 }] }).bars[0].valueLabel // "33 Mi"
 */
export const buildCorRacaGeometry = ({
  width,
  bars,
}: {
  width: number;
  bars: CorRacaInput[];
}): CorRacaGeometry => {
  const layout = corRacaLayout(width);
  const step = (layout.w - layout.pad * 2) / bars.length;
  const scale: BarScale = {
    base: layout.base,
    top: layout.top,
    max: Math.max(0, ...bars.map((bar) => bar.value)),
    barWidth: Math.min(40, step * 0.4),
  };

  return {
    width: layout.w,
    height: layout.h,
    base: layout.base,
    baseline: { x1: layout.pad / 2, x2: layout.w - layout.pad / 2 },
    bars: bars.map((bar, index) =>
      corRacaBar(bar, layout.pad + step * index + step / 2, scale),
    ),
  };
};

export type SexColumn = {
  label: "Mulher" | "Homem";
  value: number;
  share: number;
  ratio: number;
};

const ratioOf = (value: number, base: number): number =>
  base > 0 ? value / base : 0;

/**
 * Duas colunas do painel de sexo, mulheres antes de homens. `share` é a
 * participação no total; `ratio` é a altura relativa à maior coluna.
 *
 * @example sexColumns({ mulheres: 28_240_713, homens: 26_417_802 })[0].share // ≈ 0.517
 */
export const sexColumns = (sexo: {
  mulheres: number;
  homens: number;
}): SexColumn[] => {
  const total = sexo.mulheres + sexo.homens;
  const max = Math.max(sexo.mulheres, sexo.homens);
  const column = (label: SexColumn["label"], value: number): SexColumn => ({
    label,
    value,
    share: ratioOf(value, total),
    ratio: ratioOf(value, max),
  });

  return [column("Mulher", sexo.mulheres), column("Homem", sexo.homens)];
};

export type PyramidRow = {
  label: string;
  mulheres: number;
  homens: number;
  mulheresRatio: number;
  homensRatio: number;
};

export type PyramidBandSummary = {
  title: string;
  mulheresShare: number;
  homensShare: number;
};

const pyramidMax = (piramide: PopulacaoPorFaixa[]): number =>
  Math.max(0, ...piramide.flatMap((row) => [row.mulheres, row.homens]));

/**
 * Linhas da pirâmide de cima para baixo (a faixa mais velha primeiro). A
 * entrada vem em ordem crescente de idade; a ordem de exibição é a inversa.
 * Ratio é relativo à maior barra entre os dois sexos.
 *
 * @example pyramidRows([{ faixa: "0 a 9 anos", mulheres: 1, homens: 2 }, { faixa: "80+ anos", mulheres: 4, homens: 3 }])[0].label // "80+ anos"
 */
export const pyramidRows = (piramide: PopulacaoPorFaixa[]): PyramidRow[] => {
  const max = pyramidMax(piramide);

  return [...piramide].reverse().map((row) => ({
    label: row.faixa,
    mulheres: row.mulheres,
    homens: row.homens,
    mulheresRatio: ratioOf(row.mulheres, max),
    homensRatio: ratioOf(row.homens, max),
  }));
};

const OPEN_BAND = /^(\d+)\+ anos$/;
const CLOSED_BAND = /^(\d+) a (\d+) anos$/;

// Os rótulos vêm de FAIXAS_DECENAIS em demografiaPanel.ts; um rótulo novo
// precisa de regra aqui, por isso falha em vez de titular errado.
const bandTitle = (label: string): string => {
  const open = OPEN_BAND.exec(label);

  if (open) return `Faixa de ${open[1]} anos ou mais`;
  const closed = CLOSED_BAND.exec(label);

  if (closed) return `Faixa de ${closed[1]} a ${closed[2]} anos`;
  throw new Error(
    `Unrecognized pyramid band label "${label}"; expected "A a B anos" or "N+ anos".`,
  );
};

/**
 * Título e participação de cada sexo numa faixa da pirâmide.
 *
 * @example describePyramidBand({ label: "30 a 39 anos", mulheres: 60, homens: 40, mulheresRatio: 1, homensRatio: 0.67 }) // { title: "Faixa de 30 a 39 anos", mulheresShare: 0.6, homensShare: 0.4 }
 */
export const describePyramidBand = (row: PyramidRow): PyramidBandSummary => {
  const total = row.mulheres + row.homens;

  return {
    title: bandTitle(row.label),
    mulheresShare: ratioOf(row.mulheres, total),
    homensShare: ratioOf(row.homens, total),
  };
};
