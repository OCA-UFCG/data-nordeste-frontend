"use client";

import { ChartColumnIncreasing, Wallet } from "lucide-react";
import { useMemo } from "react";
import { ChartCard } from "@/components/Panel/cards/ChartCard";
import {
  ColumnChart,
  toColumnTable,
} from "@/components/Panel/charts/ColumnChart";
import {
  HighlightCard,
  withCommonFit,
} from "@/components/Panel/cards/HighlightCards";
import { PanelCarousel } from "@/components/Panel/layout/PanelCarousel";
import type { ColumnConfig } from "@/features/panels/chartOptions";
import type {
  IdhGroupPoint,
  IdhGroupSerie,
} from "@/features/panels/idh/idhPanel";
import {
  formatIdh,
  formatIdhCard,
  formatRenda,
  formatRendaLabel,
  IDH_COLORS,
  NO_DATA,
  yearLabels,
} from "@/features/panels/idh/idhFormat";

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

const groupCards = (groups: IdhGroupSerie[], ano: number) => [
  ...groups.map((group) => ({
    icon: ChartColumnIncreasing,
    label: `IDH · ${group.label}`,
    value: cardValue(group, ano, "idh", formatIdhCard),
  })),
  ...groups.map((group) => ({
    icon: Wallet,
    label: `Rendimento médio · ${group.label}`,
    value: cardValue(group, ano, "rendimento", formatRenda),
  })),
];

const useGroupSeries = (
  groups: IdhGroupSerie[],
  metric: GroupMetric,
  formatLabel: (value: number) => string,
  formatValue: (value: number) => string,
) =>
  useMemo(
    () => ({
      formatLabel,
      formatValue,
      categories: yearLabels(groups[0]?.serie ?? []),
      series: groups.map((group, index) => ({
        name: group.label,
        color: IDH_COLORS[index % IDH_COLORS.length],
        values: group.serie.map((point: IdhGroupPoint) => point[metric]),
      })),
    }),
    [groups, metric, formatLabel, formatValue],
  );

const GroupChart = ({
  title,
  label,
  config,
  onSelectYear,
}: {
  title: string;
  label: string;
  config: ColumnConfig;
  onSelectYear: (ano: number) => void;
}) => (
  <ChartCard title={title} table={toColumnTable(title, "Ano", config)}>
    <ColumnChart
      label={label}
      {...config}
      onSelectLabel={(ano) => onSelectYear(Number(ano))}
    />
  </ChartCard>
);

export const IdhGroupView = ({
  groups,
  ano,
  dimension,
  onSelectYear,
}: {
  groups: IdhGroupSerie[];
  ano: number;
  dimension: string;
  onSelectYear: (ano: number) => void;
}) => {
  const idh = useGroupSeries(groups, "idh", formatIdh, formatIdh);
  const rendimento = useGroupSeries(
    groups,
    "rendimento",
    formatRendaLabel,
    formatRenda,
  );

  return (
    <div className="flex flex-col gap-6">
      <PanelCarousel label="Indicadores" columns="lg:grid-cols-4">
        {withCommonFit(groupCards(groups, ano)).map((item) => (
          <HighlightCard key={item.label} tone="orange" {...item} />
        ))}
      </PanelCarousel>
      <div className="flex flex-col gap-6">
        <GroupChart
          title={`Evolução anual do IDH ${dimension}`}
          label={`Gráfico de colunas do IDH ${dimension} por ano`}
          config={idh}
          onSelectYear={onSelectYear}
        />
        <GroupChart
          title={`Rendimento médio dos ocupados ${dimension} (R$)`}
          label={`Gráfico de colunas do rendimento médio ${dimension} por ano`}
          config={rendimento}
          onSelectYear={onSelectYear}
        />
      </div>
    </div>
  );
};
