"use client";

import { Users } from "lucide-react";
import { DemografiaCharts } from "@/components/DemografiaDashboard/DemografiaCharts";
import { ChoroplethMap } from "@/components/Panel/ChoroplethMap";
import { HighlightCard } from "@/components/Panel/HighlightCards";
import { PanelHeader } from "@/components/Panel/PanelShell";
import { TerritorialFilterBar } from "@/components/Panel/TerritorialFilterBar";
import { useTerritorialNavigation } from "@/components/Panel/useTerritorialNavigation";
import {
  DEMOGRAFIA_YEAR_RANGE,
  POPULACAO_MAP_BUCKETS,
  type DemografiaPanelData,
} from "@/features/panels/demografia/demografiaPanel";
import { formatNumber } from "@/features/panels/format";
import {
  defaultTerritorialFilters,
  listYears,
} from "@/features/panels/territorialFilters";
import { describeTerritorialSelection } from "@/features/panels/territorialOptions";

const MESH_URL = "/maps/municipios-sudene.json";
const YEARS = listYears(DEMOGRAFIA_YEAR_RANGE);
const DEFAULTS = defaultTerritorialFilters(DEMOGRAFIA_YEAR_RANGE);
const pessoas = (value: number) => formatNumber(value);

export const DemografiaDashboard = ({
  data,
}: {
  data: DemografiaPanelData;
}) => {
  const { filters } = data;
  const { isPending, applyFilters, selectMunicipality } =
    useTerritorialNavigation(filters, DEMOGRAFIA_YEAR_RANGE);
  const populacao = data.serie.find(
    (point) => point.label === String(filters.ano),
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <PanelHeader
        title="Perfil demográfico"
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
          <HighlightCard
            tone="pink"
            icon={Users}
            label="População residente"
            value={populacao ? pessoas(populacao.value) : "Sem dados"}
          />
          <ChoroplethMap
            title="População por município"
            meshUrl={MESH_URL}
            regions={data.mapa}
            buckets={POPULACAO_MAP_BUCKETS}
            valueLabel="População"
            formatValue={pessoas}
            selectedCode={filters.mun}
            onSelectRegion={selectMunicipality}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <DemografiaCharts data={data} />
        </div>
      </div>
    </div>
  );
};
