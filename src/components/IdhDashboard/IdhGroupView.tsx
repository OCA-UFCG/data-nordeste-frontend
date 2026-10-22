"use client";

import { ChartColumnIncreasing, Wallet } from "lucide-react";
import { useMemo } from "react";
import { ChartCard } from "@/components/Panel/ChartCard";
import { ColumnChart } from "@/components/Panel/ColumnChart";
import {
  HighlightCard,
  type HighlightItem,
} from "@/components/Panel/HighlightCards";
import { SwipeRow } from "@/components/Panel/SwipeRow";
import type {
  IdhGroupPoint,
  IdhGroupSerie,
} from "@/features/panels/idh/idhPanel";
import {
  formatIdh,
  formatRenda,
  formatRendaLabel,
  IDH_COLORS,
  NO_DATA,
  yearLabels,
} from "@/components/IdhDashboard/idhFormat";

type GroupMetric = "idh" | "rendimento";

const cardValue = (
  group: IdhGroupSerie,
  ano: number,
  metric: GroupMetric,
  format: (value: number) => string,
) => {
  const point = group.serie.find((item) => item.ano === ano);

  return point ? format(point[metric]) : NO_DATA;
};

const groupCards = (groups: IdhGroupSerie[], ano: number): HighlightItem[] => [
  ...groups.map((group) => ({
    icon: ChartColumnIncreasing,
    label: `IDH · ${group.label}`,
    value: cardValue(group, ano, "idh", formatIdh),
  })),
  ...groups.map((group) => ({
    icon: Wallet,
    label: `Rendimento médio · ${group.label}`,
    value: cardValue(group, ano, "rendimento", formatRenda),
  })),
];

const useGroupSeries = (groups: IdhGroupSerie[], metric: GroupMetric) =>
  useMemo(
    () => ({
      categories: yearLabels(groups[0]?.serie ?? []),
      series: groups.map((group, index) => ({
        name: group.label,
        color: IDH_COLORS[index % IDH_COLORS.length],
        values: group.serie.map((point: IdhGroupPoint) => point[metric]),
      })),
    }),
    [groups, metric],
  );

export const IdhGroupView = ({
  groups,
  ano,
  dimension,
}: {
  groups: IdhGroupSerie[];
  ano: number;
  dimension: string;
}) => {
  const idh = useGroupSeries(groups, "idh");
  const rendimento = useGroupSeries(groups, "rendimento");

  return (
    <div className="flex flex-col gap-6">
      <SwipeRow label="Indicadores" columns="lg:grid-cols-4">
        {groupCards(groups, ano).map((item) => (
          <HighlightCard key={item.label} tone="orange" {...item} />
        ))}
      </SwipeRow>
      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <ChartCard title={`Evolução anual do IDH ${dimension}`}>
          <ColumnChart
            label={`Gráfico de colunas do IDH ${dimension} por ano`}
            {...idh}
            formatLabel={formatIdh}
            formatValue={formatIdh}
          />
        </ChartCard>
        <ChartCard title={`Rendimento médio dos ocupados ${dimension}`}>
          <ColumnChart
            label={`Gráfico de colunas do rendimento médio ${dimension} por ano`}
            {...rendimento}
            formatLabel={formatRendaLabel}
            formatValue={formatRenda}
          />
        </ChartCard>
      </div>
    </div>
  );
};
