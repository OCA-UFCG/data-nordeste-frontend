"use client";

import { useState } from "react";
import { PanelMap, type PanelMapProps } from "@/components/PanelMap/PanelMap";
import { PanelMapCardActions } from "@/components/PanelMap/PanelMapCardActions";
import {
  PANEL_MAP_HINT,
  panelMapImageSource,
} from "@/components/PanelMap/panelMapTexts";
import { usePanelMapCard } from "@/components/PanelMap/usePanelMapCard";
import { usePanelMapFilters } from "@/components/PanelMap/usePanelMapFilters";
import type { PibCardProps } from "@/components/PibDashboard/pibCardProps";
import {
  PIB_CARD_FOOTER,
  PIB_CARD_INFO,
  PIB_CARD_SOURCE,
  PIB_MAP_TITLE,
} from "@/components/PibDashboard/pibTexts";
import { ProtoCard } from "@/components/ProtoPanel/ProtoCard";
import { ProtoMapFullscreen } from "@/components/ProtoPanel/ProtoMapFullscreen";
import { formatPibReais } from "@/features/panels/pib/pibFormat";
import { areaLabel } from "@/features/panels/territorialOptions";
import type { TerritorialFilters } from "@/features/panels/territorialFilters";

// Rodapé da tela cheia; a imagem baixada do card credita o basemap ativo
// (`usePanelMapCard`).
const FULLSCREEN_SOURCE = panelMapImageSource(PIB_CARD_SOURCE);

// Altura fixa: o mapa preenche o card ao lado da coluna dos setores sem
// depender da proporção da malha.
const MAP_BOX_CLASS = "h-[480px] rounded-[8px] max-[1000px]:h-[400px]";

const usePibMapProps = (
  selection: TerritorialFilters,
  onFiltersChange: (filters: TerritorialFilters) => void,
): PanelMapProps => ({
  ...usePanelMapFilters(selection, onFiltersChange),
  indicator: "pib",
  deepest: "municipio",
  formatValue: formatPibReais,
  label: PIB_MAP_TITLE,
});

/**
 * Card "Mapa do PIB por município": cada município na cor da faixa do seu PIB
 * total. Aproximar ou clicar no mapa troca Estado e Município no filtro do
 * painel, pelo mesmo caminho da barra de filtros.
 *
 * @example <PibMapCard data={panel} selection={filters} onFiltersChange={request} state="ok" onRetry={retry} />
 */
export const PibMapCard = ({
  selection,
  onFiltersChange,
  state,
  onRetry,
}: Omit<PibCardProps, "place"> & {
  selection: TerritorialFilters;
  onFiltersChange: (filters: TerritorialFilters) => void;
}) => {
  const card = usePanelMapCard(PIB_CARD_SOURCE);
  const [fullscreen, setFullscreen] = useState(false);
  const mapProps = usePibMapProps(selection, onFiltersChange);
  const subtitle = `PIB total · ${areaLabel(selection.area)} · ${selection.ano}`;

  return (
    <ProtoCard
      state={state}
      onRetry={onRetry}
      footer={PIB_CARD_FOOTER}
      title={PIB_MAP_TITLE}
      subtitle={subtitle}
      kind="map"
      bodyClassName="flex flex-col"
      overlay={
        <ProtoMapFullscreen
          open={fullscreen}
          onOpenChange={setFullscreen}
          title={PIB_MAP_TITLE}
          subtitle={subtitle}
          source={FULLSCREEN_SOURCE}
          hint={PANEL_MAP_HINT}
          renderStage={(frame) => <PanelMap {...mapProps} className={frame} />}
        />
      }
      actions={
        <PanelMapCardActions
          title={PIB_MAP_TITLE}
          info={PIB_CARD_INFO.map}
          imageSource={card.imageSource}
          engine={card.engine}
          disabled={state === "loading" || state === "error"}
          onOpenFullscreen={() => setFullscreen(true)}
        />
      }
    >
      <PanelMap {...mapProps} {...card.mapBinding} className={MAP_BOX_CLASS} />
    </ProtoCard>
  );
};
