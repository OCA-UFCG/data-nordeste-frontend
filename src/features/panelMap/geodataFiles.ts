import type { PanelIndicator } from "@/features/panelMap/geodataTypes";

/**
 * GeoJSON das feições do indicador, relativo ao GEODATA_DIR. A aridez usa a
 * malha municipal sem valores: os números do tooltip vêm do painel.
 * Ex.: `featureFileFor("aridez")` → `"vector/municipios.geojson"`.
 */
export function featureFileFor(indicator: PanelIndicator): string {
  const name = indicator === "aridez" ? "municipios" : indicator;

  return `vector/${name}.geojson`;
}
