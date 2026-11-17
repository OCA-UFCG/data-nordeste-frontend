import type { PibYearPoint } from "@/features/panels/pib/pibPanel";
import {
  describeYearChange,
  formatYearChange,
  type YearChangeTone,
  yearChangeTone,
} from "@/features/panels/yearChange";

export type PibChangePill = { text: string; direction: YearChangeTone };

export type PibBigNumber = {
  key: "pib" | "perCapita";
  label: string;
  value: number | null;
  pill: PibChangePill | null;
};

const PICK = {
  pib: (point: PibYearPoint) => point.pib,
  perCapita: (point: PibYearPoint) => point.perCapita,
} as const;

/**
 * Variação para o ano anterior. "Primeiro ano da série" só no primeiro ano;
 * nos demais, sem variação calculável (ano anterior zerado), não há pill.
 *
 * @example describePibChangePill(serie, 0, (point) => point.pib) // { text: "Primeiro ano da série", direction: "flat" }
 */
export const describePibChangePill = (
  serie: readonly PibYearPoint[],
  index: number,
  pick: (point: PibYearPoint) => number,
): PibChangePill | null => {
  if (index === 0) return { text: "Primeiro ano da série", direction: "flat" };
  const points = serie.map((point) => ({
    label: String(point.ano),
    value: pick(point),
  }));
  const change = describeYearChange(points, index);

  if (!change) return null;

  return { text: formatYearChange(change), direction: yearChangeTone(change) };
};

/**
 * Os dois números de destaque do PIB no ano escolhido: o total e o per
 * capita, com a variação para o ano anterior. Sem o ano na série, o valor e a
 * variação vêm nulos.
 *
 * @example buildPibBigNumbers(serie, 2021)[0] // { key: "pib", label: "PIB", value: 1.5e12, pill: { … } }
 */
export const buildPibBigNumbers = (
  serie: readonly PibYearPoint[],
  ano: number,
): PibBigNumber[] => {
  const index = serie.findIndex((point) => point.ano === ano);
  const point = serie[index];
  const build = (key: PibBigNumber["key"], label: string): PibBigNumber => ({
    key,
    label,
    value: point ? PICK[key](point) : null,
    pill: point ? describePibChangePill(serie, index, PICK[key]) : null,
  });

  return [build("pib", "PIB"), build("perCapita", "PIB per capita")];
};
