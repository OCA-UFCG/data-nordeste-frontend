"use client";

import {
  ChartArea,
  ChartBar,
  ChartColumnIncreasing,
  CircleDollarSign,
  Wallet,
} from "lucide-react";
import { useMemo } from "react";
import { ChartCard } from "@/components/Panel/cards/ChartCard";
import { ChoroplethMap } from "@/components/Panel/charts/ChoroplethMap";
import { toColumnTable } from "@/components/Panel/charts/ColumnChart";
import type { DataTableContent } from "@/components/Panel/cards/DataTable";
import {
  HighlightCard,
  withCommonFit,
} from "@/components/Panel/cards/HighlightCards";
import { LineChart } from "@/components/Panel/charts/LineChart";
import { PanelCarousel } from "@/components/Panel/layout/PanelCarousel";
import {
  IDH_MAP_BUCKETS,
  type IdhPanelData,
  type IdhYearPoint,
} from "@/features/panels/idh/idhPanel";
import {
  formatIdh,
  formatIdhCard,
  formatRenda,
  IDH_LINE_COLORS,
  NO_DATA,
  yearLabels,
} from "@/features/panels/idh/idhFormat";

const MESH_URL = "/maps/estados-nordeste.json";
const EVOLUTION_TITLE =
  "Evolução anual do IDH e do IDH ajustado à desigualdade";

const OCEAN_COLOR = "#c5e0fa";

const EVOLUTION_HEIGHT =
  "h-80 w-full lg:h-auto lg:min-h-80 lg:flex-1 xl:h-[34rem] xl:flex-none";

const overviewCards = (point?: IdhYearPoint) => {
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

const useEvolutionSeries = (serie: IdhYearPoint[]) =>
  useMemo(
    () => ({
      formatLabel: formatIdh,
      formatValue: formatIdh,
      categories: yearLabels(serie),
      series: [
        {
          name: "IDH",
          color: IDH_LINE_COLORS.idh,
          values: serie.map((point) => point.idh),
        },
        {
          name: "IDH ajustado à desigualdade",
          color: IDH_LINE_COLORS.idhAjustado,
          values: serie.map((point) => point.idhAjustado),
        },
      ],
    }),
    [serie],
  );

const toMapTable = (data: IdhPanelData): DataTableContent => ({
  caption: `IDH por estado em ${data.filters.ano}`,
  columns: ["Estado", "IDH"],
  rows: data.mapa.map((region) => [
    `${region.name} (${region.uf})`,
    formatIdh(region.value),
  ]),
});

const EvolutionCard = ({
  serie,
  ano,
  onSelectYear,
}: {
  serie: IdhYearPoint[];
  ano: number;
  onSelectYear: (ano: number) => void;
}) => {
  const evolution = useEvolutionSeries(serie);

  return (
    <ChartCard
      title={EVOLUTION_TITLE}
      table={toColumnTable(EVOLUTION_TITLE, "Ano", evolution)}
      tableClassName={EVOLUTION_HEIGHT}
    >
      <LineChart
        label="Gráfico de linhas do IDH e do IDH ajustado por ano"
        className={EVOLUTION_HEIGHT}
        {...evolution}
        selectedLabel={String(ano)}
        onSelectLabel={(ano) => onSelectYear(Number(ano))}
      />
    </ChartCard>
  );
};

export const IdhOverview = ({
  data,
  onSelectUf,
  onSelectYear,
}: {
  data: IdhPanelData;
  onSelectUf: (uf: string) => void;
  onSelectYear: (ano: number) => void;
}) => {
  const selected = data.serie.find((point) => point.ano === data.filters.ano);

  return (
    <div className="flex flex-col gap-6">
      <PanelCarousel
        label="Indicadores"
        columns="lg:grid-cols-3 xl:grid-cols-5"
      >
        {withCommonFit(overviewCards(selected)).map((item) => (
          <HighlightCard key={item.label} tone="idh" {...item} />
        ))}
      </PanelCarousel>
      <div className="grid gap-6 lg:grid-cols-2">
        <EvolutionCard
          serie={data.serie}
          ano={data.filters.ano}
          onSelectYear={onSelectYear}
        />
        <div className="flex min-h-0 min-w-0 xl:h-0 xl:min-h-full [&>*]:flex-1">
          <ChoroplethMap
            title="IDH por estado"
            meshUrl={MESH_URL}
            regions={data.mapa}
            buckets={IDH_MAP_BUCKETS}
            valueLabel="IDH"
            formatValue={formatIdh}
            selectedCode={data.filters.uf}
            table={toMapTable(data)}
            onSelectRegion={onSelectUf}
            background={OCEAN_COLOR}
            fill
          />
        </div>
      </div>
    </div>
  );
};
