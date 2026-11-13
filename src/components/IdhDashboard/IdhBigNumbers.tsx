"use client";

import type { ProtoCardState } from "@/components/ProtoPanel/ProtoCard";
import {
  ProtoStatCards,
  type ProtoStatCell,
} from "@/components/ProtoPanel/ProtoStatCards";
import { describeIdhClass } from "@/features/panels/idh/idhClasses";
import { formatIdhCard, formatRenda } from "@/features/panels/idh/idhFormat";
import type {
  IdhPanelData,
  IdhYearPoint,
} from "@/features/panels/idh/idhPanel";

const bigNumbers = (data: IdhPanelData): ProtoStatCell[] => {
  const point = data.serie.find((item) => item.ano === data.filters.ano);
  const show = (format: (value: number) => string, key: keyof IdhYearPoint) =>
    point ? format(point[key]) : null;

  return [
    {
      icon: "idh",
      label: "IDH",
      value: show(formatIdhCard, "idh"),
      caption: describeIdhClass(data),
    },
    {
      icon: "idhad",
      label: "IDH ajustado à desigualdade",
      value: show(formatIdhCard, "idhAjustado"),
    },
    {
      icon: "gini",
      label: "Índice de Gini",
      value: show(formatIdhCard, "gini"),
    },
    {
      icon: "renda",
      label: "Renda domiciliar per capita",
      value: show(formatRenda, "rendaPerCapita"),
    },
    {
      icon: "rend",
      label: "Rendimento médio dos ocupados",
      value: show(formatRenda, "rendimento"),
    },
  ];
};

/**
 * Indicadores do topo da visão geral do IDH (`.bns` do protótipo): a lista
 * de indicadores do IDH entra na faixa compartilhada `ProtoStatCards`.
 *
 * @example <IdhBigNumbers data={panel} state="ok" onRetry={retry} />
 */
export const IdhBigNumbers = ({
  data,
  state,
  onRetry,
}: {
  data: IdhPanelData;
  state: ProtoCardState;
  onRetry: () => void;
}) => (
  <ProtoStatCards cells={bigNumbers(data)} state={state} onRetry={onRetry} />
);
