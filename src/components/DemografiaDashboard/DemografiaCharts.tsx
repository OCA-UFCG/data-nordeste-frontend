"use client";

import { ChevronDown, Lightbulb } from "lucide-react";
import { useMemo } from "react";
import { ChartCard } from "@/components/Panel/ChartCard";
import { ColumnChart } from "@/components/Panel/ColumnChart";
import { PanelCarousel } from "@/components/Panel/PanelCarousel";
import { PieChart } from "@/components/Panel/PieChart";
import { PyramidChart } from "@/components/Panel/PyramidChart";
import { ValueBars } from "@/components/Panel/ValueBars";
import { describeDemografia } from "@/features/panels/demografia/demografiaAnalise";
import {
  topMunicipios,
  type DemografiaPanelData,
} from "@/features/panels/demografia/demografiaPanel";
import { formatNumberCompact, formatPessoas } from "@/features/panels/format";

const MULHER_COLOR = "#c53d69";
const HOMEM_COLOR = "#97b42e";
const BAR_COLOR = "#e482a9";

// Pirâmide estreita: "4,4 mi" e "129 mil" em vez do número completo.
const formatPessoasCurto = (value: number) =>
  formatNumberCompact(value, value >= 1e6 ? 1 : 0);

// "48 MI", como no Figma.
const formatSerieLabel = (value: number) =>
  formatNumberCompact(value, 0).toUpperCase();

const SexoCharts = ({ data }: { data: DemografiaPanelData }) => {
  const slices = useMemo(
    () => [
      { label: "Mulher", value: data.sexo.mulheres, color: MULHER_COLOR },
      { label: "Homem", value: data.sexo.homens, color: HOMEM_COLOR },
    ],
    [data.sexo],
  );
  const piramide = useMemo(() => {
    // O ECharts desenha a primeira categoria embaixo: "0 a 9 anos" na base.
    const faixas = data.piramide;

    return {
      categories: faixas.map((faixa) => faixa.faixa),
      left: {
        name: "Mulher",
        color: MULHER_COLOR,
        values: faixas.map((faixa) => faixa.mulheres),
      },
      right: {
        name: "Homem",
        color: HOMEM_COLOR,
        values: faixas.map((faixa) => faixa.homens),
      },
    };
  }, [data.piramide]);

  return (
    <PanelCarousel label="População por sexo" columns="xl:grid-cols-2">
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
          formatShort={formatPessoasCurto}
        />
      </ChartCard>
    </PanelCarousel>
  );
};

const AnaliseDescritiva = ({ data }: { data: DemografiaPanelData }) => (
  <details className="group rounded-lg bg-green-800 text-grey-100">
    <summary className="flex cursor-pointer list-none items-center gap-3 p-6 [&::-webkit-details-marker]:hidden">
      <Lightbulb aria-hidden className="size-6 shrink-0" />
      <span className="flex-1 text-xl font-semibold leading-9">
        Análise descritiva
      </span>
      <ChevronDown
        aria-hidden
        className="size-6 shrink-0 transition-transform group-open:rotate-180"
      />
    </summary>
    <ul className="flex list-disc flex-col gap-2 px-6 pb-6 pl-11 text-base leading-relaxed">
      {describeDemografia(data).map((frase) => (
        <li key={frase}>{frase}</li>
      ))}
    </ul>
  </details>
);

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
        <ValueBars
          points={top}
          formatValue={formatPessoas}
          barClassName="bg-pink-500"
        />
      </ChartCard>
      <ChartCard title="População por cor ou raça">
        <ValueBars
          points={data.corRaca}
          formatValue={formatPessoas}
          barClassName="bg-pink-500"
        />
      </ChartCard>
      <ChartCard title="Série temporal">
        <ColumnChart
          label="Gráfico de colunas da população por censo"
          fit
          {...serie}
          formatLabel={formatSerieLabel}
          formatValue={formatPessoas}
        />
      </ChartCard>
      <AnaliseDescritiva data={data} />
    </>
  );
};
