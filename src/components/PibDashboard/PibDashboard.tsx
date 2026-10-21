"use client";

import { CircleDollarSign, Wallet } from "lucide-react";
import { useMemo } from "react";
import { ChartCard, ChartNotice } from "@/components/Panel/ChartCard";
import { ChoroplethMap } from "@/components/Panel/ChoroplethMap";
import { HorizontalBarChart } from "@/components/Panel/HorizontalBarChart";
import { KpiCards } from "@/components/Panel/KpiCards";
import { PanelHeader } from "@/components/Panel/PanelShell";
import { RankedBars } from "@/components/Panel/RankedBars";
import { TerritorialFilterBar } from "@/components/Panel/TerritorialFilterBar";
import { TrendChart, type TrendMetric } from "@/components/Panel/TrendChart";
import { useTerritorialNavigation } from "@/components/Panel/useTerritorialNavigation";
import {
  formatPercent,
  formatReaisAxis,
  formatReaisCompact,
} from "@/features/panels/format";
import {
  PIB_MAP_BUCKETS,
  PIB_YEAR_RANGE,
  type PibPanelData,
  type PibYearPoint,
} from "@/features/panels/pib/pibPanel";
import {
  defaultTerritorialFilters,
  listYears,
} from "@/features/panels/territorialFilters";
import { describeTerritorialSelection } from "@/features/panels/territorialOptions";

const MESH_URL = "/maps/municipios-sudene.json";
const YEARS = listYears(PIB_YEAR_RANGE);
const DEFAULTS = defaultTerritorialFilters(PIB_YEAR_RANGE);
const reais = (value: number) => formatReaisCompact(value);
const percent = (value: number) => formatPercent(value, 2);

const trendMetrics = (serie: PibYearPoint[]): TrendMetric[] => [
  {
    key: "pib",
    label: "PIB total",
    points: serie.map((point) => ({
      label: String(point.ano),
      value: point.pib,
    })),
    formatLabel: (value) => formatReaisCompact(value, 2),
    formatValue: reais,
    formatAxis: formatReaisAxis,
  },
  {
    key: "perCapita",
    label: "PIB per capita",
    points: serie.map((point) => ({
      label: String(point.ano),
      value: point.perCapita,
    })),
    formatLabel: (value) => formatReaisCompact(value, 1),
    formatValue: reais,
    formatAxis: formatReaisAxis,
  },
];

const kpis = (point?: PibYearPoint) => [
  {
    icon: CircleDollarSign,
    label: "PIB",
    value: point ? reais(point.pib) : "Sem dados",
  },
  {
    icon: Wallet,
    label: "PIB per capita",
    value: point ? reais(point.perCapita) : "Sem dados",
  },
];

const VabNotice = ({ ano }: { ano: number }) => (
  <ChartNotice>
    O IBGE ainda não divulgou o Valor Adicionado Bruto de {ano}. Os dados de
    2022 e 2023 entram aqui assim que forem publicados.
  </ChartNotice>
);

const PibSectorCharts = ({ data }: { data: PibPanelData }) => (
  <>
    <ChartCard title="Valor Adicionado Bruto (VAB) por setor">
      {data.vab ? (
        <HorizontalBarChart
          points={data.vab}
          formatValue={reais}
          label="Gráfico de barras do VAB por setor"
        />
      ) : (
        <VabNotice ano={data.filters.ano} />
      )}
    </ChartCard>
    <ChartCard title="Participação da atividade com maior VAB no PIB">
      {data.atividades.length ? (
        <RankedBars points={data.atividades} formatValue={percent} />
      ) : (
        <VabNotice ano={data.filters.ano} />
      )}
    </ChartCard>
  </>
);

export const PibDashboard = ({ data }: { data: PibPanelData }) => {
  const { filters } = data;
  const { isPending, applyFilters, selectMunicipality } =
    useTerritorialNavigation(filters, PIB_YEAR_RANGE);
  const selected = data.serie.find((point) => point.ano === filters.ano);
  const metrics = useMemo(() => trendMetrics(data.serie), [data.serie]);

  return (
    <div className="flex w-full flex-col gap-6">
      <PanelHeader
        title="Produto Interno Bruto (PIB)"
        subtitle={describeTerritorialSelection(data)}
      >
        <TerritorialFilterBar
          filters={filters}
          ufs={data.ufs}
          municipios={data.municipios}
          defaults={DEFAULTS}
          years={YEARS}
          onChange={applyFilters}
        />
      </PanelHeader>
      <div
        aria-busy={isPending}
        className="grid grid-cols-1 gap-6 transition-opacity aria-busy:opacity-60 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
      >
        <div className="flex min-w-0 flex-col gap-6">
          <KpiCards items={kpis(selected)} />
          <ChoroplethMap
            title="PIB por município"
            meshUrl={MESH_URL}
            regions={data.mapa}
            buckets={PIB_MAP_BUCKETS}
            valueLabel="PIB"
            formatValue={reais}
            selectedCode={filters.mun}
            onSelectRegion={selectMunicipality}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <TrendChart
            title="Evolução anual"
            metrics={metrics}
            selectedLabel={String(filters.ano)}
          />
          <PibSectorCharts data={data} />
        </div>
      </div>
    </div>
  );
};
