import type { ChartPoint } from "@/features/panels/chartBase";
import { buildZeroAxis } from "@/features/panels/pib/pibAxis";

// `share`: largura da barra, de 0 a 1 do eixo.
export type PibBarRow = { label: string; value: number; share: number };

export type PibBarUnit = { divisor: number; label: string };

export type PibVabBars = {
  rows: PibBarRow[];
  ticks: number[];
  unit: PibBarUnit;
  total: number;
};

export type PibAtividadeBars = { rows: PibBarRow[]; ticks: number[] };

const UNITS: readonly PibBarUnit[] = [
  { divisor: 1e12, label: "trilhões" },
  { divisor: 1e9, label: "bilhões" },
  { divisor: 1e6, label: "milhões" },
  { divisor: 1e3, label: "mil" },
];

const REAIS: PibBarUnit = { divisor: 1, label: "reais" };

/**
 * Unidade do eixo do VAB a partir do maior valor. O protótipo fixa "R$
 * bilhões"; um município pequeno teria o eixo todo em "0,00", então a
 * unidade acompanha os dados.
 *
 * @example pibBarUnit(413_890_000_000) // { divisor: 1e9, label: "bilhões" }
 */
export const pibBarUnit = (highest: number): PibBarUnit =>
  UNITS.find((unit) => highest >= unit.divisor) ?? REAIS;

// VAB negativo existe (indústria de alguns municípios): a barra some, o valor fica.
const shareOf = (value: number, max: number): number =>
  max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;

/**
 * Barras do "VAB por setor": setores do maior para o menor, o eixo redondo
 * a partir de zero na unidade dos dados e a soma dos setores.
 *
 * @example buildVabBars([{ label: "Serviços", value: 4.1e11 }]).ticks // [0, 120, 240, 360, 480]
 */
export const buildVabBars = (vab: readonly ChartPoint[]): PibVabBars => {
  const sorted = [...vab].sort((a, b) => b.value - a.value);
  const highest = sorted[0]?.value ?? 0;
  const unit = pibBarUnit(highest);
  const axis = buildZeroAxis(highest / unit.divisor);

  return {
    rows: sorted.map((point) => ({
      ...point,
      share: shareOf(point.value / unit.divisor, axis.max),
    })),
    ticks: axis.ticks,
    unit,
    total: sorted.reduce((sum, point) => sum + point.value, 0),
  };
};

const TOP_ATIVIDADES = 3;
const PERCENT_STEP = 10;
const MIN_PERCENT_AXIS = 20;

/**
 * Barras da "Participação da atividade com maior VAB no PIB": as três
 * atividades de maior participação (em % do PIB), num eixo de 10 em 10 que
 * vai pelo menos até 20%.
 *
 * @example buildAtividadeBars([{ label: "Demais serviços", value: 26.8 }]).ticks // [0, 10, 20, 30]
 */
export const buildAtividadeBars = (
  atividades: readonly ChartPoint[],
): PibAtividadeBars => {
  const top = atividades
    .filter((point) => point.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, TOP_ATIVIDADES);
  const highest = top[0]?.value ?? 0;
  const max = Math.max(
    MIN_PERCENT_AXIS,
    Math.ceil(highest / PERCENT_STEP) * PERCENT_STEP,
  );

  return {
    rows: top.map((point) => ({ ...point, share: shareOf(point.value, max) })),
    ticks: Array.from(
      { length: max / PERCENT_STEP + 1 },
      (_, index) => index * PERCENT_STEP,
    ),
  };
};
