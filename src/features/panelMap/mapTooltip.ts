import type { MapFeatureProps } from "@/features/panelMap/geodataTypes";
import { yearField } from "@/features/panelMap/qgisPaint";
import { rankRegions } from "@/features/panels/choropleth";
import { formatNumber } from "@/features/panels/format";

export const NO_DATA_LABEL = "sem dado";

// `value` null: a feição não tem número para mostrar (só o nome).
export type MapTooltipText = {
  title: string;
  value: string | null;
  rank: string | null;
};

/** Lê o número de uma feição, ou `null` sem dado. */
export type FeatureValueReader = (feature: MapFeatureProps) => number | null;

/** Valor da feição no ano, ou `null` quando ausente ou não numérico. */
export function valueOf(feature: MapFeatureProps, ano: number): number | null {
  const value = feature[yearField(ano) as `v${number}`];

  return typeof value === "number" ? value : null;
}

/**
 * De onde vem o número da feição: dos `values` do painel por `code` quando
 * vierem (a aridez, cuja malha não tem valores), senão do `v<ano>` do GeoJSON.
 * Ex.: `featureValueReader(2023)(recife)` → `recife.v2023`.
 */
export function featureValueReader(
  ano: number,
  values?: ReadonlyMap<string, number>,
): FeatureValueReader {
  if (values) return (feature) => values.get(feature.code) ?? null;

  return (feature) => valueOf(feature, ano);
}

/**
 * Ranking só entre as feições com número (a área de interesse).
 * Ex.: valores 5, null, 9 → `Map { "<9>" => 1, "<5>" => 2 }`.
 */
export function rankWithinArea(
  features: MapFeatureProps[],
  readValue: FeatureValueReader,
): Map<string, number> {
  const regions = features.flatMap((feature) => {
    const value = readValue(feature);

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
  readValue: FeatureValueReader,
  ranks: Map<string, number>,
  total: number,
  formatValue: (value: number) => string,
): MapTooltipText {
  const title = titleOf(feature);
  const value = readValue(feature);
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

/**
 * Tooltip só com o nome, para feições sem valores (a malha dos estados da
 * vista Estados do perfil).
 * Ex.: `describeMapFeatureName(pernambuco)` → `{ title: "Pernambuco (PE)", value: null, rank: null }`.
 */
export function describeMapFeatureName(
  feature: MapFeatureProps,
): MapTooltipText {
  return { title: titleOf(feature), value: null, rank: null };
}
