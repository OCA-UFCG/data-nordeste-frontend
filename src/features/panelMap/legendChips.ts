import type { FeatureCollection } from "geojson";

import {
  countByClass,
  type LegendChip,
  paletteChips,
} from "@/features/panelMap/classCounts";
import type {
  GeodataStyles,
  PanelIndicator,
} from "@/features/panelMap/geodataTypes";
import { featureProps, featuresInArea } from "@/features/panelMap/mapSelection";
import type { TerritorialArea } from "@/features/panels/territorialFilters";

export type LegendChipInputs = {
  styles: GeodataStyles;
  features: FeatureCollection;
  indicator: PanelIndicator;
  area: TerritorialArea;
  ano: number;

  // Aridez: municípios por classe predominante, por valor da classe (do banco).
  classCounts?: ReadonlyMap<number, number>;
};

/**
 * As pílulas da legenda do mapa, na ordem da tela: as classes do `.qgz` com a
 * contagem de feições da área no ano (mais "Sem dado" quando houver) ou, na
 * aridez, a paleta do raster. Sem `classCounts`, a paleta sai sem número.
 * Quem não quer números (o cartaz de download) descarta o `count`.
 *
 * @example legendChips({ styles, features, indicator: "pib", area: "nordeste", ano: 2023 }) // [{ label: "≤ R$ 500 Mi", color, count: 1219 }, …]
 */
export function legendChips(inputs: LegendChipInputs): LegendChip[] {
  const { styles, features, indicator, area, ano } = inputs;

  if (indicator === "aridez") {
    return paletteChips(styles.aridez, inputs.classCounts);
  }
  const inArea = featuresInArea(featureProps(features), indicator, area);

  return countByClass(inArea, styles.indicators[indicator].classes, ano);
}
