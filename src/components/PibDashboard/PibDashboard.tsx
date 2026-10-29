"use client";

import { LoaderCircle, Wallet } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { ChoroplethMap } from "@/components/Panel/ChoroplethMap";
import type { DataTableContent } from "@/components/Panel/DataTable";
import {
  type CardChange,
  HighlightCard,
  longestValue,
} from "@/components/Panel/HighlightCards";
import { PanelFilters } from "@/components/Panel/PanelFilters";
import { PanelPage } from "@/components/Panel/PanelPage";
import { TerritorialSelects } from "@/components/Panel/TerritorialFilterBar";
import { TrendChart, type TrendMetric } from "@/components/Panel/TrendChart";
import { useTerritorialNavigation } from "@/components/Panel/useTerritorialNavigation";
import {
  AtividadeHighlightChip,
  PIB_MAP_ID,
} from "@/components/PibDashboard/AtividadeHighlightChip";
import { PibSaibaMais } from "@/components/PibDashboard/PibSaibaMais";
import { PibSectorCharts } from "@/components/PibDashboard/PibSectorCharts";
import { PIB_ICON, PIB_TITLE } from "@/components/PibDashboard/pibTheme";
import {
  capitalizeScale,
  formatReaisAxis,
  formatReaisCompact,
} from "@/features/panels/format";
import type { ChartPoint } from "@/features/panels/chartOptions";
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
import {
  describeYearChange,
  formatYearChange,
} from "@/features/panels/yearChange";

const MESH_URL = "/maps/municipios-sudene.json";
const YEARS = listYears(PIB_YEAR_RANGE);
const DEFAULTS = defaultTerritorialFilters(PIB_YEAR_RANGE);

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

const cardChange = (points: ChartPoint[], ano: number): CardChange | null => {
  const index = points.findIndex((point) => point.label === String(ano));
  const change = describeYearChange(points, index);

  return change
    ? { ratio: change.ratio, text: formatYearChange(change) }
    : null;
};

const PibCards = ({
  ano,
  point,
  metrics,
}: {
  ano: number;
  point?: PibYearPoint;
  metrics: TrendMetric[];
}) => {
  const pib = point ? reais(point.pib) : "Sem dados";
  const perCapita = point ? reais(point.perCapita) : "Sem dados";
  const fitTo = longestValue([pib, perCapita]);

  return (
    <div className="grid grid-cols-2 gap-3 lg:gap-6">
      <HighlightCard
        tone="orange"
        icon={PIB_ICON}
        label="PIB"
        value={pib}
        fitTo={fitTo}
        caption={`em ${ano}`}
        change={cardChange(metrics[0].points, ano)}
        compact
      />
      <HighlightCard
        tone="orange"
        icon={Wallet}
        label="PIB per capita"
        value={perCapita}
        fitTo={fitTo}
        caption={`em ${ano}`}
        change={cardChange(metrics[1].points, ano)}
        compact
      />
    </div>
  );
};

const hasAtividade = (data: PibPanelData, label: string | null) =>
  data.atividades.some((point) => point.label === label);

// Atividade escolhida na lista de participação; some se o novo filtro não a
// tiver. A pré-visualização (mouse sobre a lista) vale enquanto o mouse está lá.
const useAtividadeHighlight = (data: PibPanelData) => {
  const [chosen, setChosen] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const atividade = hasAtividade(data, chosen) ? chosen : null;
  const shown = hasAtividade(data, preview) ? preview : atividade;
  const highlightCodes = useMemo(
    () =>
      shown
        ? new Set(
            data.mapa
              .filter((region) => region.atividade === shown)
              .map((region) => region.code),
          )
        : undefined,
    [shown, data.mapa],
  );

  return { atividade, setAtividade: setChosen, setPreview, highlightCodes };
};

const toMapTable = (mapa: PibPanelData["mapa"]): DataTableContent => ({
  caption: "PIB Total por município",
  columns: ["Município", "PIB"],
  rows: [...mapa]
    .sort((a, b) => b.value - a.value)
    .map((region) => [`${region.name} (${region.uf})`, reais(region.value)]),
});

// Spinner só do desktop: no celular, a barra fixa já o mostra. O chip fica aqui,
// e não sobre o mapa, para o mapa não mudar de tamanho; min-h-13 reserva a altura.
const SelectionSummary = ({
  summary,
  isPending,
  chip,
}: {
  summary: string;
  isPending: boolean;
  chip: ReactNode;
}) => (
  <div className="hidden min-h-13 items-center justify-between gap-4 lg:flex">
    <p
      aria-live="polite"
      className="flex items-center gap-2 text-base text-grey-900"
    >
      <span>
        Mostrando: <strong>{summary}</strong>
      </span>
      {isPending ? (
        <LoaderCircle
          aria-label="Atualizando"
          className="size-4 shrink-0 animate-spin text-green-800"
        />
      ) : null}
    </p>
    {chip}
  </div>
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
  const { atividade, setAtividade, setPreview, highlightCodes } =
    useAtividadeHighlight(data);
  const chip = atividade ? (
    <AtividadeHighlightChip
      atividade={atividade}
      onClear={() => setAtividade(null)}
    />
  ) : null;
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
      <SelectionSummary summary={summary} isPending={isPending} chip={chip} />
      {/* Carregando: o painel fica onde está e esmaece de leve, só se a
          consulta passar de 150 ms (troca rápida não pisca). */}
      <div
        aria-busy={isPending}
        className="grid grid-cols-1 gap-6 transition-opacity duration-300 ease-out aria-busy:opacity-75 aria-busy:delay-150 motion-reduce:transition-none lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
      >
        {/* Arranjo do Power BI: a coluna da direita (altura fixa) define a linha e
            o mapa preenche o resto. Só no xl: no lg os setores empilham e o mapa
            esticado sobraria vazio. */}
        <div className="flex min-w-0 flex-col gap-6 xl:h-0 xl:min-h-full">
          <PibCards ano={filters.ano} point={selected} metrics={metrics} />
          {chip ? <div className="lg:hidden">{chip}</div> : null}
          {/* scroll-mt-40: o "Ver no mapa" para abaixo do cabeçalho do site
              (80 px) e da barra fixa do local (~61 px). */}
          <div
            id={PIB_MAP_ID}
            className="flex min-h-0 scroll-mt-40 xl:flex-1 [&>*]:flex-1"
          >
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
            onPreviewAtividade={setPreview}
          />
        </div>
      </div>
    </PanelPage>
  );
};
