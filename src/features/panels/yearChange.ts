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

/**
 * `connector` liga o percentual ao ano anterior (padrão: "em relação a").
 *
 * @example formatYearChange({ ratio: 0.082, previousLabel: "2020" }) // "+8,2% em relação a 2020"
 */
export const formatYearChange = (
  change: YearChange,
  connector = "em relação a",
): string =>
  `${signedPercent.format(change.ratio)} ${connector} ${change.previousLabel}`;

export type YearChangeTone = "up" | "down" | "flat";

/**
 * Cor da variação de um número de destaque (perfil, PIB). Decide pelo valor já arredondado ao
 * que aparece na tela (1 casa decimal em %): 0,04% vira "0,0%", sem seta.
 *
 * @example yearChangeTone({ ratio: 0.03, previousLabel: "2010" }) // "up"
 */
export const yearChangeTone = (change: YearChange): YearChangeTone => {
  const tenthsOfPercent = Math.round(change.ratio * 1000);

  if (tenthsOfPercent > 0) return "up";
  if (tenthsOfPercent < 0) return "down";

  return "flat";
};
