import type { PanelIndicator } from "@/features/panelMap/geodataTypes";
import type { TerritorialArea } from "@/features/panels/territorialFilters";

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

/**
 * PNG da aridez da década recortado pela área do painel, relativo ao
 * GEODATA_DIR: fora da área o pipeline deixa transparente.
 * Ex.: `aridezRasterFile(2020, "semiarido")` → `"raster/aridez_2020_semiarido.png"`.
 */
export function aridezRasterFile(year: number, area: TerritorialArea): string {
  return `raster/aridez_${year}_${area}.png`;
}

/**
 * Raster do índice de aridez no mapa: `"off"` não mostra; `"base"` mostra o
 * da década do ano do painel, sempre ligado, como camada principal.
 */
export type PanelMapAridez = "off" | "base";

/**
 * Modo do raster quando o painel não diz: o mapa da aridez já nasce com ele;
 * os outros, sem. Ex.: `aridezModeFor("aridez")` → `"base"`.
 */
export function aridezModeFor(
  indicator: PanelIndicator,
  aridez?: PanelMapAridez,
): PanelMapAridez {
  return aridez ?? (indicator === "aridez" ? "base" : "off");
}
