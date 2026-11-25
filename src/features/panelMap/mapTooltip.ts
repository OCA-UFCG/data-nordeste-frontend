import type { MapFeatureProps } from "@/features/panelMap/geodataTypes";
import { yearField } from "@/features/panelMap/qgisPaint";
import { rankRegions } from "@/features/panels/choropleth";
import { formatNumber } from "@/features/panels/format";

export const NO_DATA_LABEL = "sem dado";

// `value` é a linha "<rótulo>: <número>"; null: a feição não tem número para
// mostrar (só o nome).
export type MapTooltipText = {
  title: string;

  // Linhas extras entre o título e o valor (aridez: % de cada classe); vazio
  // quando o painel não manda nenhuma.
  details: readonly string[];
  value: string | null;
  rank: string | null;
};

// Linhas extras do tooltip por feição: por `code` IBGE do município e por sigla
// do estado (no hover por estado). Vêm prontas do painel.
export type MapTooltipDetails = {
  feature: ReadonlyMap<string, readonly string[]>;
  state: ReadonlyMap<string, readonly string[]>;
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

/** Como o tooltip nomeia e formata o número da feição. */
export type MapValueFormat = {
  valueLabel: string;
  formatValue: (value: number) => string;
};

/**
 * Texto do tooltip. `total` é o número de feições ranqueadas na área.
 * Ex.: PIB 50, posição 12 de 1794 → `{ value: "PIB: R$ 50", rank: "12º de 1.794" }`.
 */
export function describeMapFeature(
  feature: MapFeatureProps,
  readValue: FeatureValueReader,
  ranks: Map<string, number>,
  total: number,
  { valueLabel, formatValue }: MapValueFormat,
): MapTooltipText {
  const title = titleOf(feature);
  const value = readValue(feature);
  const position = ranks.get(feature.code);

  if (value === null) {
    return {
      title,
      details: [],
      value: `${valueLabel}: ${NO_DATA_LABEL}`,
      rank: null,
    };
  }
  const line = `${valueLabel}: ${formatValue(value)}`;

  if (position === undefined) {
    return { title, details: [], value: line, rank: null };
  }

  return {
    title,
    details: [],
    value: line,
    rank: `${formatNumber(position)}º de ${formatNumber(total)}`,
  };
}
