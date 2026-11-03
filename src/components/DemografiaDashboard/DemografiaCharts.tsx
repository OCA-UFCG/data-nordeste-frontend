"use client";

import { Info } from "lucide-react";
import { useMemo, useState } from "react";
import { ChartCard } from "@/components/Panel/cards/ChartCard";
import {
  ColumnChart,
  toColumnTable,
} from "@/components/Panel/charts/ColumnChart";
import { HorizontalBarChart } from "@/components/Panel/charts/HorizontalBarChart";
import { PyramidChart } from "@/components/Panel/charts/PyramidChart";
import type { PreviewHandler } from "@/components/Panel/charts/RankedBars";
import { ValueBars } from "@/components/Panel/charts/ValueBars";
import type { ChartPoint } from "@/features/panels/chartOptions";
import {
  describeCorRaca,
  formatShare,
} from "@/features/panels/demografia/demografiaAnalise";
import type {
  CorRacaAno,
  DemografiaPanelData,
  PopulacaoPorFaixa,
} from "@/features/panels/demografia/demografiaPanel";
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

const largestIndex = (values: number[]) => values.indexOf(Math.max(...values));

// `sameScale`: todas as colunas na unidade da maior ("48 Mi" ... "55 Mi"), como
// no Power BI; sem ele, cada uma na sua ("69 Mil", não "0 Mi", que parece zero).
const columnConfig = (
  title: string,
  points: ChartPoint[],
  sameScale: boolean,
) => {
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
      capitalizeScale(
        formatNumberCompact(value, 0, sameScale ? largest : value),
      ),
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
  const formatValue = useMemo(() => {
    const total = sexo.mulheres + sexo.homens;

    return (value: number) =>
      `${formatPessoas(value)} (${formatShare(value, total)})`;
  }, [sexo]);

  return (
    <ChartCard title="População por sexo">
      <HorizontalBarChart
        label="Gráfico de barras da população por sexo"
        points={points}
        formatValue={formatValue}
        className="min-h-24 w-full flex-1"
        fadeOthers
        labelRoom={136}
      />
    </ChartCard>
  );
};

// Absoluta: a lista rola dentro do card e não estica a linha da grade.
export const PopulacaoPorMunicipio = ({
  points,
  selectedLabel,
  onSelect,
  onPreview,
}: {
  points: ChartPoint[];
  selectedLabel: string | null;
  onSelect: (label: string) => void;
  onPreview: PreviewHandler;
}) => (
  <ChartCard title="População por município">
    <div className="relative min-h-80 flex-1">
      <div
        role="region"
        aria-label="Lista da população por município"
        className="absolute inset-0 overflow-y-auto pr-1"
      >
        <ValueBars
          points={points}
          formatValue={formatPessoas}
          barClassName="bg-[#e482a9]"
          selectedLabel={selectedLabel}
          onSelect={onSelect}
          onPreview={onPreview}
        />
      </div>
    </div>
  </ChartCard>
);

const PIRAMIDE_TITLE = "População por faixa etária e sexo";

const FaixaValue = ({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) => (
  <span className="inline-flex items-center gap-1.5">
    <span
      aria-hidden
      className="size-2.5 rounded-full"
      style={{ backgroundColor: color }}
    />
    {label}{" "}
    <span className="tabular-nums">
      {formatPessoas(value)} ({formatShare(value, total)})
    </span>
  </span>
);

// No lugar do balão, que cobria as faixas vizinhas. Altura fixa (até duas
// linhas): trocar de faixa não mexe no card.
const FaixaReader = ({ faixa }: { faixa: PopulacaoPorFaixa }) => {
  const total = faixa.mulheres + faixa.homens;

  return (
    <p
      aria-live="polite"
      className="flex h-10 flex-wrap content-center items-center gap-x-3 text-sm leading-5 text-grey-1100"
    >
      <strong className="font-semibold">{faixa.faixa}</strong>
      <FaixaValue
        label="Mulher"
        value={faixa.mulheres}
        total={total}
        color={MULHER_COLOR}
      />
      <FaixaValue
        label="Homem"
        value={faixa.homens}
        total={total}
        color={HOMEM_COLOR}
      />
    </p>
  );
};

export const PiramideEtaria = ({
  piramide,
}: {
  piramide: DemografiaPanelData["piramide"];
}) => {
  const [hover, setHover] = useState<number | null>(null);
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
  const shown =
    piramide[
      hover ??
        largestIndex(piramide.map((faixa) => faixa.mulheres + faixa.homens))
    ];

  return (
    <ChartCard title={PIRAMIDE_TITLE} table={table}>
      {shown ? <FaixaReader faixa={shown} /> : null}
      <PyramidChart
        label="Pirâmide etária da população por sexo"
        className="min-h-80 w-full flex-1"
        {...config}
        activeIndex={hover}
        onHoverFaixa={setHover}
      />
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
  const config = useMemo(() => columnConfig("População", serie, true), [serie]);

  return (
    <ChartCard
      title={SERIE_TITLE}
      table={toColumnTable(SERIE_TITLE, "Ano", config)}
    >
      <ColumnChart
        label="Gráfico de colunas da população por censo"
        {...config}
        axisName="Ano"
        grow
        onSelectLabel={(label) => onSelectYear(Number(label))}
      />
    </ChartCard>
  );
};

const COR_RACA_TITLE = "População por cor ou raça";

// A "Análise descritiva" do Power BI, junto do gráfico que ela comenta.
const CorRacaNota = ({ lines }: { lines: string[] }) => (
  <p className="mt-3 flex gap-2 text-sm leading-relaxed text-grey-1000">
    <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
    <span className="flex flex-col gap-1">
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </span>
  </p>
);

export const PopulacaoPorCorRaca = ({
  corRaca,
  anterior,
}: {
  corRaca: ChartPoint[];
  anterior: CorRacaAno | null;
}) => {
  const config = useMemo(() => {
    const total = corRaca.reduce((sum, point) => sum + point.value, 0);

    return {
      ...columnConfig("População", corRaca, false),
      formatValue: (value: number) =>
        `${formatPessoas(value)} (${formatShare(value, total)})`,
    };
  }, [corRaca]);

  return (
    <ChartCard
      title={COR_RACA_TITLE}
      table={toColumnTable(COR_RACA_TITLE, "Cor ou raça", config)}
    >
      <ColumnChart
        label="Gráfico de colunas da população por cor ou raça"
        {...config}
        rotateLabels
      />
      <CorRacaNota lines={describeCorRaca(corRaca, anterior)} />
    </ChartCard>
  );
};
