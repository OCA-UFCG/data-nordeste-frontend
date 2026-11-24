import type { PanelIndicator } from "@/features/panelMap/geodataTypes";
import type { TerritorialArea } from "@/features/panels/territorialFilters";

/**
 * GeoJSON das feições do indicador, relativo ao GEODATA_DIR. A aridez usa a
 * malha municipal sem valores: os números do tooltip vêm do painel.
 * Ex.: `featureFileFor("aridez")` → `"vector/municipios.geojson"`.
 */
export function featureFileFor(indicator: PanelIndicator): string {
  const name = indicator === "aridez" ? "municipios" : indicator;

  return `vector/${name}.geojson`;
}

/**
 * Estados recortados pela área de interesse (a união dos municípios dela por
 * UF, gerada por `scripts/geodata`): o hover e a seleção de estado do mapa.
 * Ex.: `areaStatesFileFor("sudene")` → `"vector/estados_sudene.geojson"`.
 */
export function areaStatesFileFor(area: TerritorialArea): string {
  return `vector/estados_${area}.geojson`;
}
