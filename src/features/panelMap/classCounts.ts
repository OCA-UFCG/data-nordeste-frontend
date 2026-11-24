import type {
  AridezPaletteEntry,
  MapFeatureProps,
  QgisClass,
} from "@/features/panelMap/geodataTypes";
import { valueOf } from "@/features/panelMap/mapTooltip";
import { classForValue, NO_DATA_COLOR } from "@/features/panelMap/qgisPaint";

export type ClassCount = { label: string; color: string; count: number };

/** Pílula da legenda; sem `count`, só o rótulo. */
export type LegendChip = { label: string; color: string; count?: number };

export const NO_DATA_LABEL = "Sem dado";

/**
 * Quantas feições caem em cada classe do `.qgz` no ano, na ordem das classes
 * (as que ficam com 0 aparecem). "Sem dado" fecha a lista, e só quando alguma
 * feição não tem valor numérico ou não cai em nenhuma classe.
 * Ex.: `countByClass(municipios, classes, 2023)` → `[{ label: "Pequeno", color, count: 1619 }, …]`.
 */
export function countByClass(
  features: MapFeatureProps[],
  classes: QgisClass[],
  ano: number,
): ClassCount[] {
  const counts = classes.map(({ label, color }) => ({
    label,
    color,
    count: 0,
  }));
  let noData = 0;

  for (const feature of features) {
    const matched = classForValue(classes, valueOf(feature, ano));
    const index = matched ? classes.indexOf(matched) : -1;

    if (index === -1) noData += 1;
    else counts[index].count += 1;
  }

  if (noData === 0) return counts;

  return [
    ...counts,
    { label: NO_DATA_LABEL, color: NO_DATA_COLOR, count: noData },
  ];
}

/**
 * Legenda da aridez: as classes da paleta na ordem do styles.json, com a
 * contagem que o painel mandou por valor da classe (classe ausente → 0). Sem
 * contagens, as pílulas saem sem número.
 * Ex.: `paletteChips(palette, new Map([[2, 10]]))` → `[{ label: "Árido", color, count: 10 }, …]`.
 */
export function paletteChips(
  palette: AridezPaletteEntry[],
  counts?: ReadonlyMap<number, number>,
): LegendChip[] {
  return palette.map(({ value, label, color }) =>
    counts ? { label, color, count: counts.get(value) ?? 0 } : { label, color },
  );
}
