"use client";

import type { FeatureCollection } from "geojson";
import { useEffect, useMemo, useState } from "react";

import type { PanelIndicator } from "@/features/panelMap/geodataTypes";
import { featureProps, featuresInArea } from "@/features/panelMap/mapSelection";
import {
  describeMapFeature,
  describeMapFeatureName,
  featureValueReader,
  type FeatureValueReader,
  type MapTooltipText,
  rankWithinArea,
} from "@/features/panelMap/mapTooltip";
import type { TerritorialArea } from "@/features/panels/territorialFilters";
import type { PanelMapEngine, PanelMapHover } from "@/lib/panelMapEngine";

export type PanelMapTooltipArgs = {
  engine: PanelMapEngine | null;
  features: FeatureCollection;
  indicator: PanelIndicator;
  area: TerritorialArea;
  ano: number;

  // Valores por `code` vindos do painel (aridez); sem eles, o `v<ano>` do GeoJSON.
  values?: ReadonlyMap<string, number>;
  formatValue: (value: number) => string;

  // Feições sem valores (malha dos estados): o tooltip mostra só o nome.
  nameOnly?: boolean;
};

export type PanelMapTooltipState = MapTooltipText & { x: number; y: number };

// 12 px abaixo e à direita do ponteiro.
const TOOLTIP_OFFSET_PX = 12;

// PERF: o ranking percorre ~1.800 municípios; só muda com feições, área e
// valores (o leitor muda com o ano ou os `values`).
function useAreaRanks(
  args: PanelMapTooltipArgs,
  readValue: FeatureValueReader,
): Map<string, number> {
  const { features, indicator, area } = args;

  return useMemo(() => {
    const props = featureProps(features);

    return rankWithinArea(featuresInArea(props, indicator, area), readValue);
  }, [features, indicator, area, readValue]);
}

/**
 * Texto e posição do tooltip da feição sob o ponteiro, ou `null` fora delas.
 * O ranking é entre as feições da área de interesse no ano (IDH: os 9 estados);
 * com `values`, os números são os do painel, por `code`.
 *
 * @example const tooltip = usePanelMapTooltip({ engine, features, indicator: "pib", area, ano, formatValue });
 */
export function usePanelMapTooltip(
  args: PanelMapTooltipArgs,
): PanelMapTooltipState | null {
  const [hover, setHover] = useState<PanelMapHover | null>(null);
  const { engine, ano, values, formatValue } = args;
  const readValue = useMemo(
    () => featureValueReader(ano, values),
    [ano, values],
  );
  const ranks = useAreaRanks(args, readValue);

  useEffect(() => engine?.onHover(setHover), [engine]);
  if (!hover) return null;
  const text = args.nameOnly
    ? describeMapFeatureName(hover.props)
    : describeMapFeature(
        hover.props,
        readValue,
        ranks,
        ranks.size,
        formatValue,
      );

  return { ...text, x: hover.x, y: hover.y };
}

type PanelMapTooltipProps = { tooltip: PanelMapTooltipState | null };

/**
 * Caixa escura junto do ponteiro, dentro do mapa. `pointer-events-none` para
 * não roubar o hover das feições.
 *
 * @example <PanelMapTooltip tooltip={tooltip} />
 */
export const PanelMapTooltip = ({ tooltip }: PanelMapTooltipProps) => {
  if (!tooltip) return null;
  const left = tooltip.x + TOOLTIP_OFFSET_PX;
  const top = tooltip.y + TOOLTIP_OFFSET_PX;

  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 max-w-60 rounded-[6px] bg-grey-1100 px-3 py-2 text-xs leading-4 text-white shadow-lg"
      style={{ left, top }}
    >
      <p className="font-semibold">{tooltip.title}</p>
      {tooltip.value === null ? null : (
        <p className="mt-1 tabular-nums">{tooltip.value}</p>
      )}
      {tooltip.rank ? (
        <p className="mt-0.5 text-grey-300">{tooltip.rank} no ranking</p>
      ) : null}
    </div>
  );
};
