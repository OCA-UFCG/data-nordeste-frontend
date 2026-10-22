"use client";

import {
  ChartArea,
  ChartBar,
  ChartColumnIncreasing,
  CircleDollarSign,
  Wallet,
} from "lucide-react";
import { useMemo } from "react";
import { ChartCard } from "@/components/Panel/ChartCard";
import { ColumnChart } from "@/components/Panel/ColumnChart";
import {
  HighlightCard,
  type HighlightItem,
} from "@/components/Panel/HighlightCards";
import { HorizontalBarChart } from "@/components/Panel/HorizontalBarChart";
import { RankedBars } from "@/components/Panel/RankedBars";
import { SwipeRow } from "@/components/Panel/SwipeRow";
import type {
  IdhPanelData,
  IdhYearPoint,
} from "@/features/panels/idh/idhPanel";
import {
  formatIdh,
  formatRenda,
  IDH_COLORS,
  NO_DATA,
  yearLabels,
} from "@/components/IdhDashboard/idhFormat";

const overviewCards = (point?: IdhYearPoint): HighlightItem[] => {
  const show = (format: (value: number) => string, key: keyof IdhYearPoint) =>
    point ? format(point[key]) : NO_DATA;

  return [
    {
      icon: ChartColumnIncreasing,
      label: "IDH",
      value: show(formatIdh, "idh"),
    },
    {
      icon: ChartBar,
      label: "IDH ajustado à desigualdade",
      value: show(formatIdh, "idhAjustado"),
    },
    {
      icon: ChartArea,
      label: "Índice de Gini",
      value: show(formatIdh, "gini"),
    },
    {
      icon: CircleDollarSign,
      label: "Renda per capita",
      value: show(formatRenda, "rendaPerCapita"),
    },
    {
      icon: Wallet,
      label: "Rendimento médio dos ocupados",
      value: show(formatRenda, "rendimento"),
    },
  ];
};

const dimensions = (point?: IdhYearPoint) =>
  point
    ? [
        { label: "Longevidade", value: point.longevidade },
        { label: "Educação", value: point.educacao },
        { label: "Renda", value: point.renda },
      ]
    : [];

const useEvolutionSeries = (serie: IdhYearPoint[]) =>
  useMemo(
    () => ({
      categories: yearLabels(serie),
      series: [
        {
          name: "IDH",
          color: IDH_COLORS[0],
          values: serie.map((point) => point.idh),
        },
        {
          name: "IDH ajustado à desigualdade",
          color: IDH_COLORS[1],
          values: serie.map((point) => point.idhAjustado),
        },
      ],
    }),
    [serie],
  );

const RankingCard = ({ data }: { data: IdhPanelData }) => (
  <ChartCard
    title={
      data.filters.recorte === "rm"
        ? "IDH por região metropolitana"
        : "IDH por estado"
    }
  >
    <RankedBars points={data.ranking} formatValue={formatIdh} />
  </ChartCard>
);

export const IdhOverview = ({ data }: { data: IdhPanelData }) => {
  const selected = data.serie.find((point) => point.ano === data.filters.ano);
  const evolution = useEvolutionSeries(data.serie);

  return (
    <div className="flex flex-col gap-6">
      <SwipeRow label="Indicadores" columns="lg:grid-cols-3 xl:grid-cols-5">
        {overviewCards(selected).map((item) => (
          <HighlightCard key={item.label} tone="orange" {...item} />
        ))}
      </SwipeRow>
      <ChartCard title="Evolução anual do IDH e IDH ajustado à desigualdade">
        <ColumnChart
          label="Gráfico de colunas do IDH e do IDH ajustado por ano"
          {...evolution}
          formatLabel={formatIdh}
          formatValue={formatIdh}
        />
      </ChartCard>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <ChartCard title="IDH por dimensão">
          <HorizontalBarChart
            points={dimensions(selected)}
            formatValue={formatIdh}
            label="Gráfico de barras do IDH por dimensão"
          />
        </ChartCard>
        <RankingCard data={data} />
      </div>
    </div>
  );
};
