/**
 * Década do raster de aridez para o ano do painel: o ano do manifest mais
 * recente que não passa de `ano`, ou `null` quando todos são posteriores.
 * Ex.: `aridezRasterYear([1990, 2000, 2010, 2020], 2011)` → `2010`.
 */
export function aridezRasterYear(
  years: readonly number[],
  ano: number,
): number | null {
  const reached = years.filter((year) => year <= ano);

  return reached.length > 0 ? Math.max(...reached) : null;
}
