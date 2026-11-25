"use client";

import { useState } from "react";
import {
  IDH_CARD_INFO,
  IDH_MAP_LABEL,
} from "@/components/IdhDashboard/idhCardTexts";
import { IDH_CARD_SOURCE } from "@/components/IdhDashboard/idhTheme";
import { PanelMap, type PanelMapProps } from "@/components/PanelMap/PanelMap";
import { PanelMapCardActions } from "@/components/PanelMap/PanelMapCardActions";
import { panelMapPosterInput } from "@/components/PanelMap/panelMapPoster";
import { PanelMapSkeleton } from "@/components/PanelMap/PanelMapSkeleton";
import { PANEL_MAP_HINT } from "@/components/PanelMap/panelMapTexts";
import { usePanelMapCard } from "@/components/PanelMap/usePanelMapCard";
import {
  type RecorteAdapter,
  useRecorteFilters,
} from "@/components/PanelMap/usePanelMapFilters";
import {
  ProtoCard,
  type ProtoCardState,
} from "@/components/ProtoPanel/ProtoCard";
import { ProtoMapFullscreen } from "@/components/ProtoPanel/ProtoMapFullscreen";
import {
  idhToRecorte,
  recorteToIdh,
} from "@/features/panelMap/panelMapAdapters";
import { formatIdhCard } from "@/features/panels/idh/idhFormat";
import type { IdhFilters } from "@/features/panels/idh/idhPanel";
import { withYear } from "@/features/panels/territorialFilters";

const TITLE = "Mapa do IDH por estado";

// O cartaz de download: "Mapa do IDH - {lugar}".
const POSTER_TEXTS = {
  name: "IDH",
  subtitle: "Faixas de desenvolvimento humano",
  source: IDH_CARD_SOURCE,
};

// Altura fixa: o mapa preenche o card ao lado do ranking sem depender da
// proporção da malha.
const MAP_BOX_CLASS = "h-[480px] rounded-[8px] max-[1000px]:h-[400px]";

const IDH_ADAPTER: RecorteAdapter<IdhFilters> = {
  toRecorte: idhToRecorte,
  fromRecorte: recorteToIdh,
};

const useIdhMapProps = (
  selection: IdhFilters,
  onFiltersChange: (filters: IdhFilters) => void,
): PanelMapProps => ({
  ...useRecorteFilters(selection, IDH_ADAPTER, onFiltersChange),
  ano: selection.ano,
  area: "nordeste",
  indicator: "idh",
  deepest: "estado",

  // Duas casas, como o IDH nos shapes do Drive (a terceira seria inventada).
  formatValue: formatIdhCard,
  valueLabel: "IDH",
  label: IDH_MAP_LABEL,
});

/**
 * Card "Mapa do IDH por estado": cada estado na cor da faixa do seu IDH.
 * Aproximar ou clicar no mapa troca o Estado no filtro do painel, pelo mesmo
 * caminho da barra de filtros. O diálogo da tela cheia fica no `overlay`: no
 * corpo, o esqueleto do carregando o desmontaria a cada filtro aplicado.
 *
 * @example <IdhMapCard selection={filters} state="ok" onRetry={retry} onFiltersChange={changeFilters} />
 */
export const IdhMapCard = ({
  selection,
  state,
  onRetry,
  onFiltersChange,
}: {
  selection: IdhFilters;
  state: ProtoCardState;
  onRetry: () => void;
  onFiltersChange: (filters: IdhFilters) => void;
}) => {
  const card = usePanelMapCard(IDH_CARD_SOURCE);
  const [fullscreen, setFullscreen] = useState(false);
  const mapProps = useIdhMapProps(selection, onFiltersChange);

  // O ano pedido, como o mapa: o card não espera o servidor (`map: []` em
  // `idhCardState.ts`).
  const subtitle = withYear("Faixas de desenvolvimento humano", selection.ano);

  return (
    <ProtoCard
      title={TITLE}
      subtitle={subtitle}
      kind="map"
      skeleton={<PanelMapSkeleton boxClassName={MAP_BOX_CLASS} />}
      state={state}
      onRetry={onRetry}
      bodyClassName="flex flex-col"
      actions={
        <PanelMapCardActions
          title={TITLE}
          info={IDH_CARD_INFO.map}
          imageSource={card.imageSource}
          engine={card.engine}
          poster={panelMapPosterInput(mapProps, card.geodata, POSTER_TEXTS)}
          disabled={state !== "ok"}
          onOpenFullscreen={() => setFullscreen(true)}
        />
      }
      overlay={
        <ProtoMapFullscreen
          open={fullscreen}
          onOpenChange={setFullscreen}
          title={TITLE}
          subtitle={subtitle}
          hint={PANEL_MAP_HINT}
          renderStage={(frame) => <PanelMap {...mapProps} className={frame} />}
        />
      }
    >
      <PanelMap {...mapProps} {...card.mapBinding} className={MAP_BOX_CLASS} />
    </ProtoCard>
  );
};
