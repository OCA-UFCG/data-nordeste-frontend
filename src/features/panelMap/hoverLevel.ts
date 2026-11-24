import type { FeatureLevel } from "@/features/panelMap/featureLevel";
import {
  levelOfRecorte,
  type MapRecorte,
} from "@/features/panelMap/mapRecorte";

/**
 * O que o hover do mapa nomeia: a própria feição do indicador (município, ou
 * o estado no IDH) ou o estado do município sob o ponteiro.
 */
export type PanelMapHoverLevel = "feicao" | "estado";

/**
 * Nível do hover, o próximo nível abaixo do recorte (como no Atlas da
 * Desertificação): só com a área de interesse, os estados; com estado ou
 * município escolhido, os municípios. Com feições de estado (IDH), a feição.
 * Decisão do usuário, 24/11/2026.
 * Ex.: `hoverLevelFor("municipio", EMPTY_RECORTE)` → `"estado"`.
 */
export function hoverLevelFor(
  featureLevel: FeatureLevel,
  recorte: MapRecorte,
): PanelMapHoverLevel {
  if (featureLevel === "estado") return "feicao";

  return levelOfRecorte(recorte) === "area" ? "estado" : "feicao";
}
