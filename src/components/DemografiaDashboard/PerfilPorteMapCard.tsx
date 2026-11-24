"use client";

import { useMemo, useState } from "react";
import type { PerfilCardProps } from "@/components/DemografiaDashboard/perfilCardProps";
import { PERFIL_CARD_SOURCE } from "@/components/DemografiaDashboard/perfilTexts";
import { DataTable } from "@/components/Panel/cards/DataTable";
import { PanelMap, type PanelMapProps } from "@/components/PanelMap/PanelMap";
import { PanelMapCardActions } from "@/components/PanelMap/PanelMapCardActions";
import { PanelMapSkeleton } from "@/components/PanelMap/PanelMapSkeleton";
import {
  PANEL_MAP_HINT,
  panelMapImageSource,
} from "@/components/PanelMap/panelMapTexts";
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

const TITLE = "Porte dos municípios";
const INFO =
  "Classifica os municípios do território por faixa de população (pequeno, médio e grande). Aproxime o mapa para filtrar o painel por estado e por município.";

// Rodapé da tela cheia; a imagem baixada do card credita o basemap ativo
// (`usePanelMapCard`).
const FULLSCREEN_SOURCE = panelMapImageSource(PERFIL_CARD_SOURCE);

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
  formatValue: formatPessoas,
  label: TITLE,
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
 * Estado da tela cheia do mapa de porte. Fica no dashboard, não no card: a
 * troca entre a grade e o aviso de dados vazios monta o card de novo, e sem
 * isso a tela cheia fechava (revisão da PR #400).
 *
 * @example const porteView = usePorteMapView(); <PerfilPorteMapCard {...card} mapView={porteView} />
 */
export const usePorteMapView = () => {
  const [fullscreen, setFullscreen] = useState(false);

  return { fullscreen, setFullscreen };
};

export type PorteMapView = ReturnType<typeof usePorteMapView>;

/**
 * Card "Porte dos municípios": cada município na cor da faixa de população
 * (pequeno, médio e grande). Aproximar ou clicar no mapa troca Estado e
 * Município no filtro do painel, pelo mesmo caminho da barra de filtros.
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
          source={FULLSCREEN_SOURCE}
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
