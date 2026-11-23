import type { MapFeatureProps } from "@/features/panelMap/geodataTypes";
import { yearField } from "@/features/panelMap/qgisPaint";
import { rankRegions } from "@/features/panels/choropleth";
import { formatNumber } from "@/features/panels/format";

export const NO_DATA_LABEL = "sem dado";

export type MapTooltipText = {
  title: string;
  value: string;
  rank: string | null;
};

function valueOf(feature: MapFeatureProps, ano: number): number | null {
  const value = feature[yearField(ano) as `v${number}`];

  return typeof value === "number" ? value : null;
}

/**
 * Ranking só entre as feições com número no ano (a área de interesse).
 * Ex.: valores 5, null, 9 → `Map { "<9>" => 1, "<5>" => 2 }`.
 */
export function rankWithinArea(
  features: MapFeatureProps[],
  ano: number,
): Map<string, number> {
  const regions = features.flatMap((feature) => {
    const value = valueOf(feature, ano);

    return value === null ? [] : [{ code: feature.code, value }];
  });

  return rankRegions(regions);
}

// O `name` do IDH já traz a sigla ("Pernambuco (PE)"); o dos municípios não.
function titleOf({ name, uf }: MapFeatureProps): string {
  return name.endsWith(`(${uf})`) ? name : `${name} (${uf})`;
}

/**
 * Texto do tooltip. `total` é o número de feições ranqueadas na área.
 * Ex.: valor 50, posição 12 de 1794 → `{ value: "50", rank: "12º de 1.794" }`.
 */
export function describeMapFeature(
  feature: MapFeatureProps,
  ano: number,
  ranks: Map<string, number>,
  total: number,
  formatValue: (value: number) => string,
): MapTooltipText {
  const title = titleOf(feature);
  const value = valueOf(feature, ano);
  const position = ranks.get(feature.code);

  if (value === null) return { title, value: NO_DATA_LABEL, rank: null };
  if (position === undefined) {
    return { title, value: formatValue(value), rank: null };
  }

  return {
    title,
    value: formatValue(value),
    rank: `${formatNumber(position)}º de ${formatNumber(total)}`,
  };
}
