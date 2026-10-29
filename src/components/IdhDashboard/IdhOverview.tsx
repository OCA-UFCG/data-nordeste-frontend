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
import { ChoroplethMap } from "@/components/Panel/ChoroplethMap";
import { ColumnChart } from "@/components/Panel/ColumnChart";
import {
  HighlightCard,
  withCommonFit,
} from "@/components/Panel/HighlightCards";
import type { KpiItem } from "@/components/Panel/KpiCards";
import { HorizontalBarChart } from "@/components/Panel/HorizontalBarChart";
import { RankedBars } from "@/components/Panel/RankedBars";
import { PanelCarousel } from "@/components/Panel/PanelCarousel";
import {
  IDH_MAP_BUCKETS,
  type IdhPanelData,
  type IdhYearPoint,
} from "@/features/panels/idh/idhPanel";
import {
  formatIdh,
  formatIdhCard,
  formatRenda,
  IDH_COLORS,
  NO_DATA,
  yearLabels,
} from "@/features/panels/idh/idhFormat";

const MESH_URL = "/maps/estados-nordeste.json";

const overviewCards = (point?: IdhYearPoint): KpiItem[] => {
  const show = (format: (value: number) => string, key: keyof IdhYearPoint) =>
    point ? format(point[key]) : NO_DATA;

  return [
    {
      icon: ChartColumnIncreasing,
      label: "IDH",
      value: show(formatIdhCard, "idh"),
    },
    {
      icon: ChartBar,
      label: "IDH ajustado à desigualdade",
      value: show(formatIdhCard, "idhAjustado"),
    },
    {
      icon: ChartArea,
      label: "Índice de Gini",
      value: show(formatIdhCard, "gini"),
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

const isRm = (data: IdhPanelData) => data.filters.recorte === "rm";

const RankingCard = ({ data }: { data: IdhPanelData }) => (
  <ChartCard
    title={isRm(data) ? "IDH por região metropolitana" : "IDH por estado"}
  >
    <RankedBars points={data.ranking} formatValue={formatIdh} />
  </ChartCard>
);

const IdhMap = ({
  data,
  onSelectUf,
}: {
  data: IdhPanelData;
  onSelectUf: (uf: string) => void;
}) => (
  <ChoroplethMap
    title={
      isRm(data)
        ? "IDH da região metropolitana de cada estado"
        : "IDH por estado"
    }
    meshUrl={MESH_URL}
    regions={data.mapa}
    buckets={IDH_MAP_BUCKETS}
    valueLabel="IDH"
    formatValue={formatIdh}
    selectedCode={data.filters.uf}
    onSelectRegion={onSelectUf}
  />
);

// Evolução fora da grade: 10 anos × 2 séries não cabem numa coluna sem rolar.
export const IdhOverview = ({
  data,
  onSelectUf,
}: {
  data: IdhPanelData;
  onSelectUf: (uf: string) => void;
}) => {
  const selected = data.serie.find((point) => point.ano === data.filters.ano);
  const evolution = useEvolutionSeries(data.serie);

  return (
    <div className="flex flex-col gap-6">
      <PanelCarousel
        label="Indicadores"
        columns="lg:grid-cols-3 xl:grid-cols-5"
      >
        {withCommonFit(overviewCards(selected)).map((item) => (
          <HighlightCard key={item.label} tone="orange" {...item} />
        ))}
      </PanelCarousel>
      <ChartCard title="Evolução anual do IDH e IDH ajustado à desigualdade">
        <ColumnChart
          label="Gráfico de colunas do IDH e do IDH ajustado por ano"
          {...evolution}
          formatLabel={formatIdh}
          formatValue={formatIdh}
        />
      </ChartCard>
      <div className="hidden gap-6 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="min-w-0">
          <IdhMap data={data} onSelectUf={onSelectUf} />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
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
    </div>
  );
};
