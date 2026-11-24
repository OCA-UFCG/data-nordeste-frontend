"use client";

import type { FeatureCollection } from "geojson";
import { useEffect, useMemo, useState } from "react";

import type {
  MapFeatureProps,
  PanelIndicator,
} from "@/features/panelMap/geodataTypes";
import { featuresInArea } from "@/features/panelMap/mapSelection";
import {
  describeMapFeature,
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
  formatValue: (value: number) => string;
};

export type PanelMapTooltipState = MapTooltipText & { x: number; y: number };

// 12 px abaixo e à direita do ponteiro.
const TOOLTIP_OFFSET_PX = 12;

// PERF: o ranking percorre ~1.800 municípios; só muda com feições, área e ano.
function useAreaRanks(args: PanelMapTooltipArgs): Map<string, number> {
  const { features, indicator, area, ano } = args;

  return useMemo(() => {
    const props = features.features.map(
      (feature) => feature.properties as MapFeatureProps,
    );

    return rankWithinArea(featuresInArea(props, indicator, area), ano);
  }, [features, indicator, area, ano]);
}

/**
 * Texto e posição do tooltip da feição sob o ponteiro, ou `null` fora delas.
 * O ranking é entre as feições da área de interesse no ano (IDH: os 9 estados).
 *
 * @example const tooltip = usePanelMapTooltip({ engine, features, indicator: "pib", area, ano, formatValue });
 */
export function usePanelMapTooltip(
  args: PanelMapTooltipArgs,
): PanelMapTooltipState | null {
  const [hover, setHover] = useState<PanelMapHover | null>(null);
  const ranks = useAreaRanks(args);
  const { engine, ano, formatValue } = args;

  useEffect(() => engine?.onHover(setHover), [engine]);
  if (!hover) return null;
  const text = describeMapFeature(
    hover.props,
    ano,
    ranks,
    ranks.size,
    formatValue,
  );

  return { ...text, x: hover.x, y: hover.y };
}

/**
 * Caixa escura junto do ponteiro, dentro do mapa. `pointer-events-none` para
 * não roubar o hover das feições.
 *
 * @example <PanelMapTooltip tooltip={tooltip} />
 */
export const PanelMapTooltip = ({
  tooltip,
}: {
  tooltip: PanelMapTooltipState | null;
}) => {
  if (!tooltip) return null;

  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 max-w-60 rounded-[6px] bg-grey-1100 px-3 py-2 text-xs leading-4 text-white shadow-lg"
      style={{
        left: tooltip.x + TOOLTIP_OFFSET_PX,
        top: tooltip.y + TOOLTIP_OFFSET_PX,
      }}
    >
      <p className="font-semibold">{tooltip.title}</p>
      <p className="mt-1 tabular-nums">{tooltip.value}</p>
      {tooltip.rank ? (
        <p className="mt-0.5 text-grey-300">{tooltip.rank} no ranking</p>
      ) : null}
    </div>
  );
};
