"use client";

import { useState } from "react";
import { PanelMap, type PanelMapProps } from "@/components/PanelMap/PanelMap";
import { PanelMapCardActions } from "@/components/PanelMap/PanelMapCardActions";
import { panelMapPosterInput } from "@/components/PanelMap/panelMapPoster";
import { PanelMapSkeleton } from "@/components/PanelMap/PanelMapSkeleton";
import { PANEL_MAP_HINT } from "@/components/PanelMap/panelMapTexts";
import { usePanelMapCard } from "@/components/PanelMap/usePanelMapCard";
import { usePanelMapFilters } from "@/components/PanelMap/usePanelMapFilters";
import type { PibCardProps } from "@/components/PibDashboard/pibCardProps";
import { PibInfoParagraphs } from "@/components/PibDashboard/PibInfoParagraphs";
import {
  PIB_CARD_SOURCE,
  PIB_INFO,
  PIB_MAP_TITLE,
} from "@/components/PibDashboard/pibTexts";
import { ProtoCard } from "@/components/ProtoPanel/ProtoCard";
import { ProtoMapFullscreen } from "@/components/ProtoPanel/ProtoMapFullscreen";
import { formatPibReais } from "@/features/panels/pib/pibFormat";
import { areaLabel } from "@/features/panels/territorialOptions";
import type { TerritorialFilters } from "@/features/panels/territorialFilters";

// INTENTIONAL: altura fixa, e não a da coluna dos setores como na PR #413. O
// `PanelMap` só enquadra no `fitTo` (troca de recorte); um resize mantém
// centro e zoom. A coluna muda de altura com o ano (aviso sem VAB) e o
// município, com o mapa montado: ele ficaria cortado ou folgado sem reenquadrar.
const MAP_BOX_CLASS = "h-[480px] rounded-[8px] max-[1000px]:h-[400px]";

// O cartaz de download: "Mapa do PIB - {lugar}" e "PIB por município - {ano}".
const POSTER_TEXTS = {
  name: "PIB",
  subtitle: PIB_MAP_TITLE,
  source: PIB_CARD_SOURCE,
};

const usePibMapProps = (
  selection: TerritorialFilters,
  onFiltersChange: (filters: TerritorialFilters) => void,
): PanelMapProps => ({
  ...usePanelMapFilters(selection, onFiltersChange),
  indicator: "pib",
  deepest: "municipio",
  formatValue: formatPibReais,
  valueLabel: "PIB",
  label: `Mapa do ${PIB_MAP_TITLE}`,
});

/**
 * Card "PIB por município": cada município na cor da faixa do seu PIB.
 * Aproximar ou clicar no mapa troca Estado e Município no filtro do
 * painel, pelo mesmo caminho da barra de filtros.
 *
 * @example <PibMapCard selection={filters} onFiltersChange={request} state="ok" onRetry={retry} />
 */
export const PibMapCard = ({
  selection,
  onFiltersChange,
  state,
  onRetry,
}: Pick<PibCardProps, "state" | "onRetry"> & {
  selection: TerritorialFilters;
  onFiltersChange: (filters: TerritorialFilters) => void;
}) => {
  const card = usePanelMapCard(PIB_CARD_SOURCE);
  const [fullscreen, setFullscreen] = useState(false);
  const mapProps = usePibMapProps(selection, onFiltersChange);
  const subtitle = `PIB · ${areaLabel(selection.area)} · ${selection.ano}`;

  return (
    <ProtoCard
      state={state}
      onRetry={onRetry}
      title={PIB_MAP_TITLE}
      subtitle={subtitle}
      kind="map"
      skeleton={<PanelMapSkeleton boxClassName={MAP_BOX_CLASS} />}
      bodyClassName="flex flex-col"
      overlay={
        <ProtoMapFullscreen
          open={fullscreen}
          onOpenChange={setFullscreen}
          title={PIB_MAP_TITLE}
          subtitle={subtitle}
          hint={PANEL_MAP_HINT}
          renderStage={(frame) => <PanelMap {...mapProps} className={frame} />}
        />
      }
      actions={
        <PanelMapCardActions
          title={PIB_MAP_TITLE}
          info={<PibInfoParagraphs paragraphs={PIB_INFO} />}
          imageSource={card.imageSource}
          engine={card.engine}
          poster={panelMapPosterInput(mapProps, card.geodata, POSTER_TEXTS)}
          disabled={state === "loading" || state === "error"}
          onOpenFullscreen={() => setFullscreen(true)}
        />
      }
    >
      <PanelMap {...mapProps} {...card.mapBinding} className={MAP_BOX_CLASS} />
    </ProtoCard>
  );
};
