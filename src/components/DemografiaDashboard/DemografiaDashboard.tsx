"use client";

import { type ReactNode, useMemo } from "react";
import {
  PiramideEtaria,
  PopulacaoPorCorRaca,
  PopulacaoPorMunicipio,
  PopulacaoPorSexo,
  SerieTemporal,
} from "@/components/DemografiaDashboard/DemografiaCharts";
import {
  DEMOGRAFIA_ICON,
  DEMOGRAFIA_TITLE,
} from "@/components/DemografiaDashboard/demografiaTheme";
import type { DataTableContent } from "@/components/Panel/cards/DataTable";
import { HighlightCard } from "@/components/Panel/cards/HighlightCards";
import { ChoroplethMap } from "@/components/Panel/charts/ChoroplethMap";
import { PanelFilters } from "@/components/Panel/filters/PanelFilters";
import { SelectionSummary } from "@/components/Panel/filters/SelectionSummary";
import { TerritorialSelects } from "@/components/Panel/filters/TerritorialFilterBar";
import { useTerritorialNavigation } from "@/components/Panel/filters/useTerritorialNavigation";
import { PanelPage } from "@/components/Panel/layout/PanelPage";
import { getBucket } from "@/features/panels/choropleth";
import {
  DEMOGRAFIA_MAX_PLACES,
  DEMOGRAFIA_PORTES,
  DEMOGRAFIA_YEAR_RANGE,
  populacaoPorMunicipio,
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
const OCEAN_COLOR = "#c5e0fa";

// Esticam o card até a altura da linha da grade: sem faixa vazia embaixo.
const Cell = ({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) => (
  <div className={`flex min-w-0 [&>*]:flex-1 ${className}`}>{children}</div>
);

const toMapTable = (data: DemografiaPanelData): DataTableContent => ({
  caption: `Porte dos municípios em ${data.filters.ano}`,
  columns: ["Município", "População", "Porte"],
  rows: [...data.mapa]
    .sort((a, b) => b.value - a.value)
    .map((region) => [
      `${region.name} (${region.uf})`,
      formatPessoas(region.value),
      getBucket(DEMOGRAFIA_PORTES, region.value).label,
    ]),
});

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
  const municipios = useMemo(
    () => populacaoPorMunicipio(data.mapa, filters.mun),
    [data.mapa, filters.mun],
  );
  const mapTable = useMemo(() => toMapTable(data), [data]);

  return (
    <PanelPage
      title={DEMOGRAFIA_TITLE}
      icon={DEMOGRAFIA_ICON}
      tone="pink"
      source={source}
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
          maxPlaces={DEMOGRAFIA_MAX_PLACES}
        />
      </PanelFilters>
      <SelectionSummary summary={summary} isPending={isPending} />
      <div
        aria-busy={isPending}
        className="flex flex-col gap-6 transition-opacity duration-300 ease-out aria-busy:opacity-75 aria-busy:delay-150 motion-reduce:transition-none"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-[minmax(0,4.5fr)_minmax(0,3.75fr)_minmax(0,3.75fr)]">
          <Cell className="xl:col-start-2 xl:row-start-1">
            <HighlightCard
              tone="pink"
              icon={DEMOGRAFIA_ICON}
              label="População residente"
              value={populacao ? formatPessoas(populacao.value) : "Sem dados"}
              compact
              fill
            />
          </Cell>
          <Cell className="xl:col-start-3 xl:row-start-1">
            <PopulacaoPorSexo sexo={data.sexo} />
          </Cell>
          <Cell className="min-h-0 xl:col-start-1 xl:row-span-2 xl:row-start-1 xl:h-0 xl:min-h-full">
            <ChoroplethMap
              title="Porte dos municípios"
              meshUrl={MESH_URL}
              regions={data.mapa}
              buckets={DEMOGRAFIA_PORTES}
              valueLabel="População"
              formatValue={formatPessoas}
              selectedCode={singleMunicipality}
              table={mapTable}
              onSelectRegion={selectMunicipality}
              background={OCEAN_COLOR}
              fill
            />
          </Cell>
          <Cell className="xl:col-start-2 xl:row-start-2">
            <PiramideEtaria piramide={data.piramide} />
          </Cell>
          <Cell className="lg:col-span-2 xl:col-span-1 xl:col-start-3 xl:row-start-2">
            <PopulacaoPorMunicipio points={municipios} />
          </Cell>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SerieTemporal
            serie={data.serie}
            onSelectYear={(ano) => applyFilters({ ...filters, ano })}
          />
          <PopulacaoPorCorRaca corRaca={data.corRaca} />
        </div>
      </div>
    </PanelPage>
  );
};
