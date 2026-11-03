"use client";

import { useMemo } from "react";
import { ChartCard } from "@/components/Panel/cards/ChartCard";
import {
  ColumnChart,
  toColumnTable,
} from "@/components/Panel/charts/ColumnChart";
import { HorizontalBarChart } from "@/components/Panel/charts/HorizontalBarChart";
import { PyramidChart } from "@/components/Panel/charts/PyramidChart";
import { ValueBars } from "@/components/Panel/charts/ValueBars";
import type { ChartPoint } from "@/features/panels/chartOptions";
import type { DemografiaPanelData } from "@/features/panels/demografia/demografiaPanel";
import {
  capitalizeScale,
  formatNumberCompact,
  formatPessoas,
} from "@/features/panels/format";

const MULHER_COLOR = "#c53d69";
const HOMEM_COLOR = "#97b42e";
const BAR_COLOR = "#e482a9";

// Pirâmide estreita: "4,4 mi" e "129 mil" em vez do número completo.
const formatPessoasCurto = (value: number) =>
  formatNumberCompact(value, value >= 1e6 ? 1 : 0);

// Todas as colunas na unidade da maior ("0 Mi" ... "33 Mi"), como no Power BI.
const columnConfig = (title: string, points: ChartPoint[]) => {
  const largest = Math.max(...points.map((point) => point.value), 0);

  return {
    categories: points.map((point) => point.label),
    series: [
      {
        name: title,
        color: BAR_COLOR,
        values: points.map((point) => point.value),
      },
    ],
    formatLabel: (value: number) =>
      capitalizeScale(formatNumberCompact(value, 0, largest)),
    formatValue: formatPessoas,
  };
};

export const PopulacaoPorSexo = ({
  sexo,
}: {
  sexo: DemografiaPanelData["sexo"];
}) => {
  const points = useMemo(
    () => [
      { label: "Mulher", value: sexo.mulheres, color: MULHER_COLOR },
      { label: "Homem", value: sexo.homens, color: HOMEM_COLOR },
    ],
    [sexo],
  );

  return (
    <ChartCard title="População por sexo">
      <HorizontalBarChart
        label="Gráfico de barras da população por sexo"
        points={points}
        formatValue={formatPessoas}
        className="h-28 w-full"
      />
    </ChartCard>
  );
};

export const PopulacaoPorMunicipio = ({ points }: { points: ChartPoint[] }) => (
  <ChartCard title="População por município">
    <div
      role="region"
      aria-label="Lista da população por município"
      tabIndex={0}
      className="h-80 overflow-y-auto pr-1"
    >
      <ValueBars
        points={points}
        formatValue={formatPessoas}
        barClassName="bg-[#e482a9]"
      />
    </div>
  </ChartCard>
);

const PIRAMIDE_TITLE = "População por faixa etária e sexo";

export const PiramideEtaria = ({
  piramide,
}: {
  piramide: DemografiaPanelData["piramide"];
}) => {
  const config = useMemo(
    () => ({
      categories: piramide.map((faixa) => faixa.faixa),
      left: {
        name: "Mulher",
        color: MULHER_COLOR,
        values: piramide.map((faixa) => faixa.mulheres),
      },
      right: {
        name: "Homem",
        color: HOMEM_COLOR,
        values: piramide.map((faixa) => faixa.homens),
      },
      formatValue: formatPessoas,
      formatShort: formatPessoasCurto,
    }),
    [piramide],
  );
  const table = toColumnTable(PIRAMIDE_TITLE, "Faixa etária", {
    ...config,
    series: [config.left, config.right],
    formatLabel: formatPessoas,
  });

  return (
    <ChartCard title={PIRAMIDE_TITLE} table={table} toolbarInside>
      <PyramidChart label="Pirâmide etária da população por sexo" {...config} />
    </ChartCard>
  );
};

const SERIE_TITLE = "Série temporal da população";

export const SerieTemporal = ({
  serie,
  onSelectYear,
}: {
  serie: ChartPoint[];
  onSelectYear: (ano: number) => void;
}) => {
  const config = useMemo(() => columnConfig("População", serie), [serie]);

  return (
    <ChartCard
      title={SERIE_TITLE}
      table={toColumnTable(SERIE_TITLE, "Ano", config)}
      toolbarInside
    >
      <ColumnChart
        label="Gráfico de colunas da população por censo"
        {...config}
        onSelectLabel={(ano) => onSelectYear(Number(ano))}
      />
      <p className="text-center text-xs text-grey-900">Ano</p>
    </ChartCard>
  );
};

const COR_RACA_TITLE = "População por cor ou raça";

export const PopulacaoPorCorRaca = ({ corRaca }: { corRaca: ChartPoint[] }) => {
  const config = useMemo(() => columnConfig("População", corRaca), [corRaca]);

  return (
    <ChartCard
      title={COR_RACA_TITLE}
      table={toColumnTable(COR_RACA_TITLE, "Cor ou raça", config)}
      toolbarInside
    >
      <ColumnChart
        label="Gráfico de colunas da população por cor ou raça"
        {...config}
        rotateLabels
      />
    </ChartCard>
  );
};
