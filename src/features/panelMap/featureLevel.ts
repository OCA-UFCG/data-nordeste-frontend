import type { PanelIndicator } from "@/features/panelMap/geodataTypes";
import type { MapRecorte } from "@/features/panelMap/mapRecorte";

/** O que cada feição do mapa é: um município ou um estado. */
export type FeatureLevel = "municipio" | "estado";

/**
 * Nível das feições do mapa. O IDH só existe por estado: as feições dele são
 * estados, com valores; nos outros indicadores, municípios.
 * Ex.: `featureLevelFor("idh")` → `"estado"`.
 */
export function featureLevelFor(indicator: PanelIndicator): FeatureLevel {
  return indicator === "idh" ? "estado" : "municipio";
}

/**
 * O recorte como o mapa o desenha no nível: com feições de estado, um
 * município escolhido na barra não tem feição; vale o estado dele. Sem isto
 * o véu cobriria o próprio estado escolhido e o enquadramento não acharia
 * nada.
 * Ex.: `recorteForLevel({ uf: ["PE"], mun: ["2611606"] }, "estado")` → `{ uf: ["PE"], mun: [] }`.
 */
export function recorteForLevel(
  recorte: MapRecorte,
  level: FeatureLevel,
): MapRecorte {
  if (level === "municipio" || recorte.mun.length === 0) return recorte;

  return { uf: recorte.uf, mun: [] };
}
