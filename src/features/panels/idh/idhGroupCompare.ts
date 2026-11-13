import { formatNumber } from "@/features/panels/format";
import type { IdhGroupSerie } from "@/features/panels/idh/idhPanel";

export type IdhGroupMetric = "idh" | "gini" | "rendaPerCapita" | "rendimento";

export type IdhGroupValue = { label: string; value: number };

export type IdhGroupComparison = {
  values: IdhGroupValue[];

  // Fim da escala das duas barras: as duas usam o mesmo, para serem comparáveis.
  max: number;
  gap?: string;
};

const INDEX_METRICS: ReadonlySet<IdhGroupMetric> = new Set(["idh", "gini"]);

// Sinal de menos tipográfico (U+2212), como no protótipo: o hífen some ao lado
// do número.
const signOf = (value: number) => (value > 0 ? "+" : value < 0 ? "−" : "");

const valuesInYear = (
  groups: IdhGroupSerie[],
  ano: number,
  metric: IdhGroupMetric,
): IdhGroupValue[] =>
  groups.flatMap(({ label, serie }) => {
    const point = serie.find((item) => item.ano === ano);

    return point ? [{ label, value: point[metric] }] : [];
  });

// Índices em pontos (centésimos arredondados antes do sinal, para "+0,00" não
// aparecer); valores em reais, em porcentagem do primeiro grupo.
const describeGap = (
  [first, second]: IdhGroupValue[],
  isIndex: boolean,
): string | undefined => {
  if (isIndex) {
    const gap = Math.round((second.value - first.value) * 100) / 100;
    const unit = Math.abs(Math.round(gap * 100)) === 1 ? "ponto" : "pontos";

    return `${second.label}: ${signOf(gap)}${formatNumber(Math.abs(gap), 2)} ${unit} em relação a ${first.label}`;
  }
  if (first.value === 0) return undefined;

  const percent = Math.round((second.value / first.value - 1) * 1000) / 10;

  return `${second.label}: ${signOf(percent)}${formatNumber(Math.abs(percent), 1)}% em relação a ${first.label}`;
};

// Reais: a próxima centena com 10% de folga, para a maior barra não encostar no
// fim da escala.
const scaleMax = (values: IdhGroupValue[], isIndex: boolean): number => {
  if (isIndex) return 1;

  const largest = Math.max(...values.map(({ value }) => value), 0);

  return Math.max(100, Math.ceil((largest * 1.1) / 100) * 100);
};

/**
 * Os dois grupos de uma visão (sexo ou cor) num ano e numa métrica: valores,
 * fim da escala das barras e a diferença do segundo grupo para o primeiro.
 *
 * @example compareIdhGroups(panel.sexo, 2021, "idh").gap // "Mulher: +0,06 pontos em relação a Homem"
 */
export const compareIdhGroups = (
  groups: IdhGroupSerie[],
  ano: number,
  metric: IdhGroupMetric,
): IdhGroupComparison => {
  const isIndex = INDEX_METRICS.has(metric);
  const values = valuesInYear(groups, ano, metric);
  const gap = values.length === 2 ? describeGap(values, isIndex) : undefined;

  return { values, max: scaleMax(values, isIndex), ...(gap ? { gap } : {}) };
};
