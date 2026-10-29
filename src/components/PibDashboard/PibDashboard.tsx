"use client";

import { Wallet, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ChoroplethMap } from "@/components/Panel/ChoroplethMap";
import type { DataTableContent } from "@/components/Panel/DataTable";
import { HighlightCard } from "@/components/Panel/HighlightCards";
import { PanelFilters } from "@/components/Panel/PanelFilters";
import { PanelPage } from "@/components/Panel/PanelPage";
import { TerritorialSelects } from "@/components/Panel/TerritorialFilterBar";
import { TrendChart, type TrendMetric } from "@/components/Panel/TrendChart";
import { useTerritorialNavigation } from "@/components/Panel/useTerritorialNavigation";
import { PibSaibaMais } from "@/components/PibDashboard/PibSaibaMais";
import { PibSectorCharts } from "@/components/PibDashboard/PibSectorCharts";
import { PIB_ICON, PIB_TITLE } from "@/components/PibDashboard/pibTheme";
import {
  capitalizeScale,
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

// Unidades com inicial maiúscula, como no Power BI ("R$ 1,51 Tri").
const reais = (value: number) => capitalizeScale(formatReaisCompact(value));
const reaisAxis = (value: number) => capitalizeScale(formatReaisAxis(value));
const reaisIn = (reference: number) => (value: number) =>
  capitalizeScale(formatReaisCompact(value, 2, reference));

const maxOf = (values: number[]) => Math.max(...values.map(Math.abs));

// Abas e rótulos como no Power BI: a série inteira na unidade do maior valor.
const trendMetrics = (serie: PibYearPoint[]): TrendMetric[] => {
  const maxPib = maxOf(serie.map((point) => point.pib));
  const maxPerCapita = maxOf(serie.map((point) => point.perCapita));

  return [
    {
      key: "pib",
      label: "Evolução anual do PIB Total",
      points: serie.map((point) => ({
        label: String(point.ano),
        value: point.pib,
      })),
      formatLabel: reaisIn(maxPib),
      formatValue: reais,
      formatAxis: reaisAxis,
    },
    {
      key: "perCapita",
      label: "Evolução anual do PIB per capita",
      points: serie.map((point) => ({
        label: String(point.ano),
        value: point.perCapita,
      })),
      formatLabel: reaisIn(maxPerCapita),
      formatValue: reais,
      formatAxis: reaisAxis,
    },
  ];
};

const PibCards = ({ point }: { point?: PibYearPoint }) => (
  <div className="grid grid-cols-2 gap-3 lg:gap-6">
    <HighlightCard
      tone="orange"
      icon={PIB_ICON}
      label="PIB"
      value={point ? reais(point.pib) : "Sem dados"}
      compact
    />
    <HighlightCard
      tone="orange"
      icon={Wallet}
      label="PIB per capita"
      value={point ? reais(point.perCapita) : "Sem dados"}
      compact
    />
  </div>
);

// Atividade escolhida na lista de participação; some se o novo filtro não a tiver.
const useAtividadeHighlight = (data: PibPanelData) => {
  const [chosen, setChosen] = useState<string | null>(null);
  const atividade = data.atividades.some((point) => point.label === chosen)
    ? chosen
    : null;
  const highlightCodes = useMemo(
    () =>
      atividade
        ? new Set(
            data.mapa
              .filter((region) => region.atividade === atividade)
              .map((region) => region.code),
          )
        : undefined,
    [atividade, data.mapa],
  );

  return { atividade, setAtividade: setChosen, highlightCodes };
};

const toMapTable = (mapa: PibPanelData["mapa"]): DataTableContent => ({
  caption: "PIB Total por município",
  columns: ["Município", "PIB"],
  rows: [...mapa]
    .sort((a, b) => b.value - a.value)
    .map((region) => [`${region.name} (${region.uf})`, reais(region.value)]),
});

const HighlightChip = ({
  atividade,
  onClear,
}: {
  atividade: string;
  onClear: () => void;
}) => (
  <p
    aria-live="polite"
    className="flex items-center gap-2 rounded-md bg-orange-100 py-1 pl-3 pr-1 text-sm text-grey-1100"
  >
    <span className="min-w-0 flex-1">
      Destacando no mapa: <strong>{atividade}</strong>
    </span>
    <button
      type="button"
      onClick={onClear}
      aria-label="Limpar destaque"
      title="Limpar destaque"
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-orange-200"
    >
      <X aria-hidden className="size-4" />
    </button>
  </p>
);

export const PibDashboard = ({
  data,
  source,
}: {
  data: PibPanelData;
  source: string;
}) => {
  const { filters } = data;
  const { isPending, applyFilters, selectMunicipality } =
    useTerritorialNavigation(filters, PIB_YEAR_RANGE);
  const selected = data.serie.find((point) => point.ano === filters.ano);
  const metrics = useMemo(() => trendMetrics(data.serie), [data.serie]);
  const showYear = (ano: number) => applyFilters({ ...filters, ano });
  const summary = describeTerritorialSelection(data, true);
  const { atividade, setAtividade, highlightCodes } =
    useAtividadeHighlight(data);
  const mapTable = useMemo(() => toMapTable(data.mapa), [data.mapa]);

  // O mapa destaca e enquadra um município; com vários, mostra a área toda.
  const singleMunicipality =
    filters.mun?.length === 1 ? filters.mun[0] : undefined;

  return (
    <PanelPage
      title={PIB_TITLE}
      icon={PIB_ICON}
      tone="orange"
      source={source}
      info={<PibSaibaMais />}
      fullMobile
    >
      <PanelFilters
        summary={summary}
        onClear={() => applyFilters(DEFAULTS)}
        isPending={isPending}
        sticky
      >
        <TerritorialSelects
          filters={filters}
          ufs={data.ufs}
          municipios={data.municipios}
          years={YEARS}
          onChange={applyFilters}
          multiple
        />
      </PanelFilters>
      <p className="hidden text-base text-grey-900 lg:block">
        Mostrando: <strong>{summary}</strong>
      </p>
      <div
        aria-busy={isPending}
        className="grid grid-cols-1 gap-6 transition-opacity aria-busy:opacity-60 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
      >
        {/* Arranjo do Power BI. A coluna da direita (gráficos de altura fixa)
            define a linha; o mapa ocupa o que sobra à esquerda, sem branco. */}
        <div className="flex min-w-0 flex-col gap-6 lg:h-0 lg:min-h-full">
          <PibCards point={selected} />
          {atividade ? (
            <HighlightChip
              atividade={atividade}
              onClear={() => setAtividade(null)}
            />
          ) : null}
          <div className="flex min-h-0 lg:flex-1 [&>*]:flex-1">
            <ChoroplethMap
              title="PIB Total"
              meshUrl={MESH_URL}
              regions={data.mapa}
              buckets={PIB_MAP_BUCKETS}
              valueLabel="PIB"
              formatValue={reais}
              selectedCode={singleMunicipality}
              highlightCodes={highlightCodes}
              table={mapTable}
              onSelectRegion={selectMunicipality}
              fill
            />
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <TrendChart
            metrics={metrics}
            selectedLabel={String(filters.ano)}
            onSelectLabel={(label) => showYear(Number(label))}
          />
          <PibSectorCharts
            data={data}
            formatReais={reais}
            onShowYear={showYear}
            atividade={atividade}
            onSelectAtividade={setAtividade}
          />
        </div>
      </div>
    </PanelPage>
  );
};
