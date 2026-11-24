"use client";

import type { FeatureCollection } from "geojson";
import { useMemo } from "react";

import {
  countByClass,
  type LegendChip as LegendChipData,
  paletteChips,
} from "@/features/panelMap/classCounts";
import type {
  GeodataStyles,
  PanelIndicator,
} from "@/features/panelMap/geodataTypes";
import { featureProps, featuresInArea } from "@/features/panelMap/mapSelection";
import { formatNumber } from "@/features/panels/format";
import type { TerritorialArea } from "@/features/panels/territorialFilters";

// Mesmas pílulas da legenda por porte do card antigo, só que estáticas.
const LegendChip = ({ label, color, count }: LegendChipData) => (
  <li className="inline-flex items-center gap-1.5 rounded-[6px] border border-grey-300 bg-white px-2.5 py-1 text-[11.5px] font-medium">
    <i
      aria-hidden="true"
      className="inline-block size-3 rounded-full border border-black/10"
      style={{ background: color }}
    />
    {count === undefined ? label : `${label} (${formatNumber(count)})`}
  </li>
);

const LegendChips = ({
  label,
  chips,
}: {
  label: string;
  chips: LegendChipData[];
}) => (
  <ul aria-label={label} className="flex flex-wrap gap-2">
    {chips.map((chip, index) => (
      <LegendChip key={`${index}-${chip.label}`} {...chip} />
    ))}
  </ul>
);

type PanelMapLegendProps = {
  styles: GeodataStyles;
  features: FeatureCollection;
  indicator: PanelIndicator;
  area: TerritorialArea;
  ano: number;

  // Aridez: municípios por classe predominante, por valor da classe (do banco).
  classCounts?: ReadonlyMap<number, number>;
};

function legendChips(props: PanelMapLegendProps): LegendChipData[] {
  const { styles, features, indicator, area, ano } = props;

  if (indicator === "aridez") {
    return paletteChips(styles.aridez, props.classCounts);
  }
  const inArea = featuresInArea(featureProps(features), indicator, area);

  return countByClass(inArea, styles.indicators[indicator].classes, ano);
}

// PERF: a contagem percorre ~1.800 municípios; só muda com feições, área e ano.
function useLegendChips(props: PanelMapLegendProps): LegendChipData[] {
  const { styles, features, indicator, area, ano, classCounts } = props;

  return useMemo(
    () => legendChips({ styles, features, indicator, area, ano, classCounts }),
    [styles, features, indicator, area, ano, classCounts],
  );
}

/**
 * Legenda do mapa, abaixo da caixa dele: uma pílula por classe do `.qgz` com
 * a contagem de feições da área no ano ("Pequeno (1.619)"), mais "Sem dado"
 * quando houver. Na aridez, a paleta do raster com as contagens que o painel
 * mandou em `classCounts` (sem elas, só as cores).
 *
 * @example <PanelMapLegend styles={styles} features={features} indicator="pib" area="nordeste" ano={2023} />
 */
export const PanelMapLegend = (props: PanelMapLegendProps) => {
  const chips = useLegendChips(props);

  return (
    <div className="mt-3">
      <LegendChips label="Legenda do mapa" chips={chips} />
    </div>
  );
};
