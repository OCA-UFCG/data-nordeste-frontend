"use client";

import { Wallet } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { ChoroplethMap } from "@/components/Panel/charts/ChoroplethMap";
import type { DataTableContent } from "@/components/Panel/cards/DataTable";
import {
  type CardChange,
  HighlightCard,
  withCommonFit,
} from "@/components/Panel/cards/HighlightCards";
import { PanelFilters } from "@/components/Panel/filters/PanelFilters";
import { SelectionSummary } from "@/components/Panel/filters/SelectionSummary";
import { PanelPage } from "@/components/Panel/layout/PanelPage";
import { TerritorialSelects } from "@/components/Panel/filters/TerritorialFilterBar";
import {
  TrendChart,
  type TrendMetric,
} from "@/components/Panel/charts/TrendChart";
import { useTerritorialNavigation } from "@/components/Panel/filters/useTerritorialNavigation";
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
import {
  PIB_MAP_BUCKETS,
  PIB_MAX_PLACES,
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
      valueLabel: "PIB Total",
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
      valueLabel: "PIB per capita",
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

// Pela key, não pela posição: reordenar as abas não troca a variação dos cards.
const cardChange = (
  metrics: TrendMetric[],
  key: string,
  ano: number,
): CardChange | null => {
  const points = metrics.find((metric) => metric.key === key)?.points ?? [];
  const index = points.findIndex((point) => point.label === String(ano));
  const change = describeYearChange(points, index);

  return change
    ? { ratio: change.ratio, text: formatYearChange(change) }
    : null;
};

// Mesma fonte nos dois cards (withCommonFit), como nos cards do IDH.
const pibCards = (
  ano: number,
  point: PibYearPoint | undefined,
  metrics: TrendMetric[],
) =>
  withCommonFit([
    {
      icon: PIB_ICON,
      label: "PIB",
      value: point ? reais(point.pib) : "Sem dados",
      change: cardChange(metrics, "pib", ano),
    },
    {
      icon: Wallet,
      label: "PIB per capita",
      value: point ? reais(point.perCapita) : "Sem dados",
      change: cardChange(metrics, "perCapita", ano),
    },
  ]);

const PibCards = ({
  ano,
  point,
  metrics,
}: {
  ano: number;
  point?: PibYearPoint;
  metrics: TrendMetric[];
}) => (
  <div className="grid grid-cols-2 gap-3 lg:gap-6">
    {pibCards(ano, point, metrics).map((card) => (
      <HighlightCard
        key={card.label}
        tone="orange"
        caption={`em ${ano}`}
        compact
        {...card}
      />
    ))}
  </div>
);

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

  // O clique limpa a pré-visualização: senão, desmarcar com o mouse sobre a
  // linha mantém o mapa destacado até o ponteiro sair da lista.
  const setAtividade = useCallback((next: string | null) => {
    setChosen(next);
    setPreview(null);
  }, []);

  return { atividade, setAtividade, setPreview, highlightCodes };
};

const toMapTable = (mapa: PibPanelData["mapa"]): DataTableContent => ({
  caption: "PIB Total por município",
  columns: ["Município", "PIB"],
  rows: [...mapa]
    .sort((a, b) => b.value - a.value)
    .map((region) => [`${region.name} (${region.uf})`, reais(region.value)]),
});

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
          maxPlaces={PIB_MAX_PLACES}
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
