"use client";

import type { FeatureCollection } from "geojson";
import { useEffect, useMemo, useState } from "react";

import type {
  MapFeatureProps,
  PanelIndicator,
} from "@/features/panelMap/geodataTypes";
import { featureProps, featuresInArea } from "@/features/panelMap/mapSelection";
import {
  describeMapFeature,
  featureValueReader,
  type FeatureValueReader,
  type MapTooltipDetails,
  type MapTooltipText,
  type MapValueFormat,
  rankWithinArea,
} from "@/features/panelMap/mapTooltip";
import {
  describeState,
  stateProps,
  stateTotalsInArea,
} from "@/features/panelMap/stateTotals";
import type { TerritorialArea } from "@/features/panels/territorialFilters";
import type { PanelMapEngine, PanelMapHover } from "@/lib/panelMapEngine";

export type PanelMapTooltipArgs = {
  engine: PanelMapEngine | null;
  features: FeatureCollection;

  // `estados.geojson`: o nome do estado no hover por estado.
  states: FeatureCollection;
  indicator: PanelIndicator;
  area: TerritorialArea;
  ano: number;

  // Valores por `code` vindos do painel (aridez); sem eles, o `v<ano>` do GeoJSON.
  values?: ReadonlyMap<string, number>;

  // Número de cada estado por sigla no hover por estado (aridez: % de ASD do
  // estado). Sem ele, a soma do `v<ano>` dos municípios do estado na área.
  stateValues?: ReadonlyMap<string, number>;

  // Linhas extras por feição (aridez: % de cada classe), entre o nome e o valor.
  tooltipDetails?: MapTooltipDetails;
  formatValue: (value: number) => string;

  // Nome do número no tooltip ("PIB: R$ 1 mi").
  valueLabel: string;
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

type StateHoverData = {
  totals: ReadonlyMap<string, number>;
  states: MapFeatureProps[];
};

// PERF: a soma por estado também percorre os municípios; mesmas dependências
// do ranking, mais os estados e os `stateValues`.
function useStateHoverData(
  args: PanelMapTooltipArgs,
  readValue: FeatureValueReader,
): StateHoverData {
  const { features, states, area, stateValues } = args;

  return useMemo(() => {
    const municipios = featureProps(features);
    const totals =
      stateValues ?? stateTotalsInArea(municipios, area, readValue);

    return { totals, states: featureProps(states) };
  }, [features, states, area, stateValues, readValue]);
}

type HoverDescription = {
  readValue: FeatureValueReader;
  ranks: Map<string, number>;
  stateData: StateHoverData;
  format: MapValueFormat;
};

// Linhas extras da feição sob o ponteiro: por `code` no município, por sigla no
// estado. Sem `tooltipDetails`, ou sem a chave, nenhuma linha.
function detailsOf(
  hover: PanelMapHover,
  tooltipDetails: MapTooltipDetails | undefined,
): readonly string[] {
  if (!tooltipDetails) return [];
  const byKey =
    hover.level === "feicao" ? tooltipDetails.feature : tooltipDetails.state;

  return byKey.get(hover.props.code) ?? [];
}

function describeHoverText(
  hover: PanelMapHover,
  { readValue, ranks, stateData, format }: HoverDescription,
): MapTooltipText {
  if (hover.level === "feicao") {
    return describeMapFeature(
      hover.props,
      readValue,
      ranks,
      ranks.size,
      format,
    );
  }
  const state = stateProps(stateData.states, hover.props.code);

  return describeState(state, stateData.totals, format);
}

function describeHover(
  hover: PanelMapHover,
  description: HoverDescription,
  tooltipDetails: MapTooltipDetails | undefined,
): MapTooltipText {
  const text = describeHoverText(hover, description);

  return { ...text, details: detailsOf(hover, tooltipDetails) };
}

/**
 * Texto e posição do tooltip da feição sob o ponteiro, ou `null` fora delas.
 * O ranking é entre as feições da área de interesse no ano (IDH: os 9 estados);
 * com `values`, os números são os do painel, por `code`. No hover por estado
 * (só a área de interesse), o estado, o total dele na área e a posição entre
 * os estados.
 *
 * @example const tooltip = usePanelMapTooltip({ engine, features, states, indicator: "pib", area, ano, formatValue, valueLabel: "PIB" });
 */
export function usePanelMapTooltip(
  args: PanelMapTooltipArgs,
): PanelMapTooltipState | null {
  const [hover, setHover] = useState<PanelMapHover | null>(null);
  const { engine, ano, values, formatValue, valueLabel, tooltipDetails } = args;
  const readValue = useMemo(
    () => featureValueReader(ano, values),
    [ano, values],
  );
  const ranks = useAreaRanks(args, readValue);
  const stateData = useStateHoverData(args, readValue);

  useEffect(() => engine?.onHover(setHover), [engine]);
  if (!hover) return null;
  const format = { valueLabel, formatValue };
  const text = describeHover(
    hover,
    { readValue, ranks, stateData, format },
    tooltipDetails,
  );

  return { ...text, x: hover.x, y: hover.y };
}

type PanelMapTooltipProps = { tooltip: PanelMapTooltipState | null };

/**
 * Cartão branco junto do ponteiro, dentro do mapa, no estilo dos tooltips dos
 * painéis: nome, as linhas extras do painel (`details`; na aridez, o % de cada
 * classe), "<indicador>: <valor>" e posição no ranking. `pointer-events-none`
 * para não roubar o hover das feições.
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
      className="pointer-events-none absolute z-20 max-w-72 rounded-[6px] border border-grey-300 bg-white px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
      style={{ left, top }}
    >
      <p className="text-[13px] leading-5 text-grey-700">{tooltip.title}</p>
      {/* INTENTIONAL: chave pelo índice. As linhas vêm prontas do painel e
          podem repetir texto; a lista é fixa enquanto o hover não muda. */}
      {tooltip.details.map((line, index) => (
        <p key={index} className="text-[13px] leading-5 text-grey-700">
          {line}
        </p>
      ))}
      {tooltip.value === null ? null : (
        <p className="text-base font-bold leading-6 text-grey-1100 tabular-nums">
          {tooltip.value}
        </p>
      )}
      {tooltip.rank ? (
        <p className="text-xs leading-4 text-grey-600">{tooltip.rank}</p>
      ) : null}
    </div>
  );
};
