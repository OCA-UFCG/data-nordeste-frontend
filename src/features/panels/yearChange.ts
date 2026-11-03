import type { ChartPoint } from "@/features/panels/chartBase";

export type YearChange = { ratio: number; previousLabel: string };

/**
 * Variação do ponto `index` em relação ao ponto anterior da série (o ano
 * anterior, nas séries anuais). Sem anterior ou com anterior zero, não há
 * variação a mostrar.
 *
 * @example describeYearChange(serie, 11) // { ratio: 0.082, previousLabel: "2020" }
 */
export const describeYearChange = (
  points: ChartPoint[],
  index: number,
): YearChange | null => {
  const current = points[index];
  const previous = points[index - 1];

  if (!current || !previous || previous.value === 0) return null;

  return {
    ratio: current.value / previous.value - 1,
    previousLabel: previous.label,
  };
};

const signedPercent = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

/** @example formatYearChange({ ratio: 0.082, previousLabel: "2020" }) // "+8,2% em relação a 2020" */
export const formatYearChange = (change: YearChange): string =>
  `${signedPercent.format(change.ratio)} em relação a ${change.previousLabel}`;
