"use client";

import type { ProtoCardState } from "@/components/ProtoPanel/ProtoCard";
import {
  ProtoStatCards,
  type ProtoStatCell,
  type ProtoStatPill,
} from "@/components/ProtoPanel/ProtoStatCards";
import { formatPibReais } from "@/features/panels/pib/pibFormat";
import type {
  PibPanelData,
  PibYearPoint,
} from "@/features/panels/pib/pibPanel";
import { describeTerritorialSelection } from "@/features/panels/territorialOptions";
import {
  describeYearChange,
  formatYearChange,
} from "@/features/panels/yearChange";

// `.pib .bn .ico`: chip redondo, em laranja mais forte que o tom do painel.
const ICON_CLASS = "rounded-full bg-[#ffe7cf] text-[#c2570c]";

// Variação para o ano anterior; no primeiro ano da série não há com o que comparar.
const changePill = (
  serie: PibYearPoint[],
  index: number,
  pick: (point: PibYearPoint) => number,
): ProtoStatPill => {
  const points = serie.map((point) => ({
    label: String(point.ano),
    value: pick(point),
  }));
  const change = describeYearChange(points, index);

  if (!change) return { text: "Primeiro ano da série", direction: "flat" };

  return {
    text: formatYearChange(change),
    direction: change.ratio >= 0 ? "up" : "down",
  };
};

/**
 * Os dois números de destaque do PIB: o total e o per capita do ano
 * escolhido, com a variação em relação ao ano anterior.
 *
 * @example pibBigNumbers(panel)[0].value // "R$ 1,51 Tri"
 */
export const pibBigNumbers = (data: PibPanelData): ProtoStatCell[] => {
  const index = data.serie.findIndex((item) => item.ano === data.filters.ano);
  const point = data.serie[index];
  const caption = describeTerritorialSelection(data, true);
  const cell = (
    icon: "usd" | "renda",
    label: string,
    pick: (item: PibYearPoint) => number,
  ): ProtoStatCell => ({
    icon,
    label,
    caption,
    value: point ? formatPibReais(pick(point)) : null,
    pill: point ? changePill(data.serie, index, pick) : null,
  });

  return [
    cell("usd", "PIB", (item) => item.pib),
    cell("renda", "PIB per capita", (item) => item.perCapita),
  ];
};

/**
 * Números de destaque do PIB (`.pib .bns` do protótipo): dois cards lado a
 * lado, em carrossel no celular.
 *
 * @example <PibBigNumbers data={panel} state="ok" onRetry={retry} />
 */
export const PibBigNumbers = ({
  data,
  state,
  onRetry,
}: {
  data: PibPanelData;
  state: ProtoCardState;
  onRetry: () => void;
}) => (
  <ProtoStatCards
    variant="pair"
    iconClassName={ICON_CLASS}
    cells={pibBigNumbers(data)}
    state={state}
    onRetry={onRetry}
  />
);
