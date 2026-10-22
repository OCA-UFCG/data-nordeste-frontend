"use client";

import { useMemo } from "react";
import { ChartCard } from "@/components/Panel/ChartCard";
import { ColumnChart } from "@/components/Panel/ColumnChart";
import { HorizontalBarChart } from "@/components/Panel/HorizontalBarChart";
import { PieChart } from "@/components/Panel/PieChart";
import { PyramidChart } from "@/components/Panel/PyramidChart";
import { SwipeRow } from "@/components/Panel/SwipeRow";
import {
  topMunicipios,
  type DemografiaPanelData,
} from "@/features/panels/demografia/demografiaPanel";
import {
  formatNumberAxis,
  formatNumberCompact,
  formatPessoas,
} from "@/features/panels/format";

const MULHER_COLOR = "#c53d69";
const HOMEM_COLOR = "#97b42e";
const BAR_COLOR = "#e482a9";
const formatSerieLabel = (value: number) => formatNumberCompact(value, 1);

const SexoCharts = ({ data }: { data: DemografiaPanelData }) => {
  const slices = useMemo(
    () => [
      { label: "Mulher", value: data.sexo.mulheres, color: MULHER_COLOR },
      { label: "Homem", value: data.sexo.homens, color: HOMEM_COLOR },
    ],
    [data.sexo],
  );
  const piramide = useMemo(
    () => ({
      categories: data.piramide.map((faixa) => faixa.faixa),
      left: {
        name: "Homem",
        color: HOMEM_COLOR,
        values: data.piramide.map((faixa) => faixa.homens),
      },
      right: {
        name: "Mulher",
        color: MULHER_COLOR,
        values: data.piramide.map((faixa) => faixa.mulheres),
      },
    }),
    [data.piramide],
  );

  return (
    <SwipeRow label="População por sexo" columns="lg:grid-cols-2">
      <ChartCard title="População por sexo">
        <PieChart
          slices={slices}
          formatValue={formatPessoas}
          label="Gráfico de pizza da população por sexo"
        />
      </ChartCard>
      <ChartCard title="População por faixa etária e sexo">
        <PyramidChart
          label="Pirâmide etária da população por sexo"
          {...piramide}
          formatValue={formatPessoas}
          formatAxis={formatNumberAxis}
        />
      </ChartCard>
    </SwipeRow>
  );
};

export const DemografiaCharts = ({ data }: { data: DemografiaPanelData }) => {
  const top = useMemo(() => topMunicipios(data.mapa), [data.mapa]);
  const serie = useMemo(
    () => ({
      categories: data.serie.map((point) => point.label),
      series: [
        {
          name: "População",
          color: BAR_COLOR,
          values: data.serie.map((point) => point.value),
        },
      ],
    }),
    [data.serie],
  );

  return (
    <>
      <SexoCharts data={data} />
      <ChartCard title="Top 5 municípios mais populosos">
        <HorizontalBarChart
          points={top}
          formatValue={formatPessoas}
          color={BAR_COLOR}
          label="Gráfico de barras dos municípios mais populosos"
        />
      </ChartCard>
      <ChartCard title="População por cor ou raça">
        <HorizontalBarChart
          points={data.corRaca}
          formatValue={formatPessoas}
          color={BAR_COLOR}
          label="Gráfico de barras da população por cor ou raça"
        />
      </ChartCard>
      <ChartCard title="Série temporal">
        <ColumnChart
          label="Gráfico de colunas da população por censo"
          {...serie}
          formatLabel={formatSerieLabel}
          formatValue={formatPessoas}
        />
      </ChartCard>
    </>
  );
};
