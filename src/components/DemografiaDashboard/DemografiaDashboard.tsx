"use client";

import { DemografiaCharts } from "@/components/DemografiaDashboard/DemografiaCharts";
import {
  DEMOGRAFIA_ICON,
  DEMOGRAFIA_TITLE,
} from "@/components/DemografiaDashboard/demografiaTheme";
import { ChoroplethMap } from "@/components/Panel/charts/ChoroplethMap";
import { HighlightCard } from "@/components/Panel/cards/HighlightCards";
import { PanelFilters } from "@/components/Panel/filters/PanelFilters";
import { SelectionSummary } from "@/components/Panel/filters/SelectionSummary";
import { PanelPage } from "@/components/Panel/layout/PanelPage";
import { TerritorialSelects } from "@/components/Panel/filters/TerritorialFilterBar";
import { useTerritorialNavigation } from "@/components/Panel/filters/useTerritorialNavigation";
import {
  DEMOGRAFIA_MAX_PLACES,
  DEMOGRAFIA_YEAR_RANGE,
  POPULACAO_MAP_BUCKETS,
  type DemografiaPanelData,
} from "@/features/panels/demografia/demografiaPanel";
import { formatPessoas } from "@/features/panels/format";
import {
  defaultTerritorialFilters,
  listYears,
} from "@/features/panels/territorialFilters";
import { describeTerritorialSelection } from "@/features/panels/territorialOptions";

const MESH_URL = "/maps/municipios-sudene.json";
const YEARS = listYears(DEMOGRAFIA_YEAR_RANGE);
const DEFAULTS = defaultTerritorialFilters(DEMOGRAFIA_YEAR_RANGE);

export const DemografiaDashboard = ({
  data,
  source,
}: {
  data: DemografiaPanelData;
  source: string;
}) => {
  const { filters } = data;
  const { isPending, applyFilters, selectMunicipality } =
    useTerritorialNavigation(filters, DEMOGRAFIA_YEAR_RANGE);
  const populacao = data.serie.find(
    (point) => point.label === String(filters.ano),
  );
  const summary = describeTerritorialSelection(data, true);
  const singleMunicipality =
    filters.mun?.length === 1 ? filters.mun[0] : undefined;

  return (
    <PanelPage
      title={DEMOGRAFIA_TITLE}
      icon={DEMOGRAFIA_ICON}
      tone="pink"
      source={source}
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
          maxPlaces={DEMOGRAFIA_MAX_PLACES}
        />
      </PanelFilters>
      <SelectionSummary summary={summary} isPending={isPending} />
      <div
        aria-busy={isPending}
        className="grid grid-cols-1 gap-6 transition-opacity aria-busy:opacity-60 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
      >
        <div className="flex min-w-0 flex-col gap-6">
          <HighlightCard
            tone="pink"
            icon={DEMOGRAFIA_ICON}
            label="População residente"
            value={populacao ? formatPessoas(populacao.value) : "Sem dados"}
          />
          <div className="hidden lg:block">
            <ChoroplethMap
              title="População por município"
              meshUrl={MESH_URL}
              regions={data.mapa}
              buckets={POPULACAO_MAP_BUCKETS}
              valueLabel="População"
              formatValue={formatPessoas}
              selectedCode={singleMunicipality}
              onSelectRegion={selectMunicipality}
            />
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <DemografiaCharts data={data} />
        </div>
      </div>
    </PanelPage>
  );
};
