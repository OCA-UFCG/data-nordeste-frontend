"use client";

import { useMemo, useState } from "react";
import type { PerfilCardProps } from "@/components/DemografiaDashboard/perfilCardProps";
import {
  PERFIL_CARD_SOURCE,
  PERFIL_DESMEMBRAMENTO_NOTE,
} from "@/components/DemografiaDashboard/perfilTexts";
import { DataTable } from "@/components/Panel/cards/DataTable";
import { PanelMap, type PanelMapProps } from "@/components/PanelMap/PanelMap";
import { PanelMapCardActions } from "@/components/PanelMap/PanelMapCardActions";
import { panelMapPosterInput } from "@/components/PanelMap/panelMapPoster";
import { PanelMapSkeleton } from "@/components/PanelMap/PanelMapSkeleton";
import { PANEL_MAP_HINT } from "@/components/PanelMap/panelMapTexts";
import { usePanelMapCard } from "@/components/PanelMap/usePanelMapCard";
import { usePanelMapFilters } from "@/components/PanelMap/usePanelMapFilters";
import { ProtoCard } from "@/components/ProtoPanel/ProtoCard";
import { ProtoMapFullscreen } from "@/components/ProtoPanel/ProtoMapFullscreen";
import type { DemografiaPanelData } from "@/features/panels/demografia/demografiaPanel";
import { buildPerfilPorteTable } from "@/features/panels/demografia/perfilPorteTable";
import { formatPessoas } from "@/features/panels/format";
import {
  type TerritorialFilters,
  withYear,
} from "@/features/panels/territorialFilters";

const TITLE = "Porte populacional";

// O cartaz de download: "Mapa do Porte populacional - {lugar}".
const POSTER_TEXTS = {
  name: TITLE,
  subtitle: "Municípios por porte populacional",
  source: PERFIL_CARD_SOURCE,
};
const INFO = (
  <>
    <p>
      Os <b>municípios</b> são classificados <b>por porte</b> populacional:
    </p>
    <ul className="mt-1 list-disc pl-5">
      <li>Pequeno porte, até 50 mil habitantes;</li>
      <li>Médio porte, entre 50 mil e 100 mil habitantes;</li>
      <li>Grande porte, acima de 100 mil habitantes.</li>
    </ul>
    <p className="mt-2">
      <b>Obs.:</b> {PERFIL_DESMEMBRAMENTO_NOTE}
    </p>
  </>
);
const MAP_LABEL = "Mapa dos municípios por porte";

// Altura fixa (`max-height` de 560 px do `.map-box` do protótipo): sem ela o
// card cresceria com a proporção da malha.
const MAP_BOX_CLASS =
  "h-[560px] rounded-[8px] max-[1000px]:h-[480px] max-[700px]:h-[360px]";

const usePorteMapProps = (
  selection: TerritorialFilters,
  onFiltersChange: (filters: TerritorialFilters) => void,
): PanelMapProps => ({
  ...usePanelMapFilters(selection, onFiltersChange),
  indicator: "demografia",
  deepest: "municipio",
  label: MAP_LABEL,
  formatValue: formatPessoas,
  valueLabel: "População",
});

// O mapa é canvas e não tem texto para leitores de tela: a tabela escondida
// ocupa o lugar dele (revisão da PR #401).
// PERF: a tabela tem um item por município (~1 800). O elemento memorizado
// evita reconciliar todas as linhas a cada mudança de filtro do mapa.
const usePorteTable = (data: DemografiaPanelData) =>
  useMemo(
    () => <DataTable content={buildPerfilPorteTable(data)} className="" />,
    [data],
  );

/**
 * Tela cheia do mapa de porte. Fica no dashboard, não no card: a troca entre
 * a grade e o aviso de dados vazios monta o card de novo, e sem isso a tela
 * cheia fechava (revisão da PR #400).
 *
 * @example const porteView = usePorteMapView(); <PerfilPorteMapCard {...card} mapView={porteView} />
 */
export const usePorteMapView = () => {
  const [fullscreen, setFullscreen] = useState(false);

  return { fullscreen, setFullscreen };
};

export type PorteMapView = ReturnType<typeof usePorteMapView>;

/**
 * Card "Porte populacional": mapa dos municípios por faixa de população, que
 * filtra o painel pelo zoom e pelo clique. A legenda por porte destaca os
 * municípios de cada faixa.
 *
 * @example <PerfilPorteMapCard data={panel} place="Nordeste" state="ok" onRetry={retry} selection={filters} onFiltersChange={request} mapView={porteView} />
 */
export const PerfilPorteMapCard = ({
  selection,
  onFiltersChange,
  mapView,
  ...props
}: PerfilCardProps & {
  selection: TerritorialFilters;
  onFiltersChange: (filters: TerritorialFilters) => void;
  mapView: PorteMapView;
}) => {
  const { data, place, state } = props;
  const card = usePanelMapCard(PERFIL_CARD_SOURCE);
  const mapProps = usePorteMapProps(selection, onFiltersChange);
  const table = usePorteTable(data);
  const subtitle = withYear(place, data.filters.ano);

  // O diálogo fica no `overlay` do card: dentro do corpo, o esqueleto do
  // carregando o desmontaria a cada filtro aplicado em tela cheia.
  return (
    <ProtoCard
      title={TITLE}
      subtitle={subtitle}
      kind="map"
      skeleton={<PanelMapSkeleton boxClassName={MAP_BOX_CLASS} />}
      state={state}
      onRetry={props.onRetry}
      bodyClassName="flex flex-col"
      actions={
        <PanelMapCardActions
          title={TITLE}
          info={INFO}
          imageSource={card.imageSource}
          engine={card.engine}
          poster={panelMapPosterInput(mapProps, card.geodata, POSTER_TEXTS)}
          disabled={state !== "ok"}
          onOpenFullscreen={() => mapView.setFullscreen(true)}
        />
      }
      overlay={
        <ProtoMapFullscreen
          open={mapView.fullscreen}
          onOpenChange={mapView.setFullscreen}
          title={TITLE}
          subtitle={subtitle}
          hint={PANEL_MAP_HINT}
          renderStage={(frame) => <PanelMap {...mapProps} className={frame} />}
        />
      }
    >
      <PanelMap {...mapProps} {...card.mapBinding} className={MAP_BOX_CLASS} />
      <div className="sr-only">{table}</div>
    </ProtoCard>
  );
};
