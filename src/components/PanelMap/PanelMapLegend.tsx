"use client";

import type { FeatureCollection } from "geojson";
import { useMemo } from "react";

import { type ClassCount, countByClass } from "@/features/panelMap/classCounts";
import type {
  GeodataStyles,
  PanelIndicator,
} from "@/features/panelMap/geodataTypes";
import { featureProps, featuresInArea } from "@/features/panelMap/mapSelection";
import { formatNumber } from "@/features/panels/format";
import type { TerritorialArea } from "@/features/panels/territorialFilters";

type LegendChipData = { label: string; color: string; count?: number };

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

const AridezLegend = ({
  styles,
  year,
}: {
  styles: GeodataStyles;
  year: number;
}) => (
  <div className="flex flex-wrap items-center gap-2">
    <span className="text-[11.5px] font-medium text-grey-800">
      Índice de aridez ({year}):
    </span>
    <LegendChips label="Legenda do índice de aridez" chips={styles.aridez} />
  </div>
);

type PanelMapLegendProps = {
  styles: GeodataStyles;
  features: FeatureCollection;
  indicator: PanelIndicator;
  area: TerritorialArea;
  ano: number;
  aridezYear: number | null;
};

// PERF: a contagem percorre ~1.800 municípios; só muda com feições, área e ano.
function useClassCounts(props: PanelMapLegendProps): ClassCount[] {
  const { styles, features, indicator, area, ano } = props;

  return useMemo(
    () =>
      countByClass(
        featuresInArea(featureProps(features), indicator, area),
        styles.indicators[indicator].classes,
        ano,
      ),
    [styles, features, indicator, area, ano],
  );
}

/**
 * Legenda do mapa, abaixo da caixa dele: uma pílula por classe do `.qgz` com
 * a contagem de feições da área no ano ("Pequeno (1.619)"), mais "Sem dado"
 * quando houver. Com a aridez ligada, uma 2ª linha mostra a paleta do índice
 * da década escolhida, sem contagem.
 *
 * @example <PanelMapLegend styles={styles} features={features} indicator="pib" area="nordeste" ano={2023} aridezYear={null} />
 */
export const PanelMapLegend = (props: PanelMapLegendProps) => {
  const counts = useClassCounts(props);

  return (
    <div className="mt-3 space-y-2">
      <LegendChips label="Legenda do mapa" chips={counts} />
      {props.aridezYear === null ? null : (
        <AridezLegend styles={props.styles} year={props.aridezYear} />
      )}
    </div>
  );
};
