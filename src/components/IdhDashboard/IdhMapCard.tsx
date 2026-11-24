"use client";

import { useState } from "react";
import {
  IDH_CARD_FOOTER,
  IDH_CARD_INFO,
  IDH_MAP_LABEL,
} from "@/components/IdhDashboard/idhCardTexts";
import { IDH_CARD_SOURCE } from "@/components/IdhDashboard/idhTheme";
import { PanelMap, type PanelMapProps } from "@/components/PanelMap/PanelMap";
import { PanelMapCardActions } from "@/components/PanelMap/PanelMapCardActions";
import {
  PANEL_MAP_HINT,
  panelMapImageSource,
} from "@/components/PanelMap/panelMapTexts";
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
import { showsIdhData } from "@/features/panels/idh/idhCardState";
import { formatIdhCard } from "@/features/panels/idh/idhFormat";
import type { IdhFilters, IdhPanelData } from "@/features/panels/idh/idhPanel";

const TITLE = "Mapa do IDH por estado";

// Rodapé da tela cheia; a imagem baixada do card credita o basemap ativo
// (`usePanelMapCard`).
const FULLSCREEN_SOURCE = panelMapImageSource(IDH_CARD_SOURCE);

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
  label: IDH_MAP_LABEL,
});

/**
 * Card "Mapa do IDH por estado": cada estado na cor da faixa do seu IDH.
 * Aproximar ou clicar no mapa troca o Estado no filtro do painel, pelo mesmo
 * caminho da barra de filtros. O diálogo da tela cheia fica no `overlay`: no
 * corpo, o esqueleto do carregando o desmontaria a cada filtro aplicado.
 *
 * @example <IdhMapCard data={panel} selection={filters} state="ok" onRetry={retry} onFiltersChange={changeFilters} />
 */
export const IdhMapCard = ({
  data,
  selection,
  state,
  onRetry,
  onFiltersChange,
}: {
  data: IdhPanelData;
  selection: IdhFilters;
  state: ProtoCardState;
  onRetry: () => void;
  onFiltersChange: (filters: IdhFilters) => void;
}) => {
  const card = usePanelMapCard(IDH_CARD_SOURCE);
  const [fullscreen, setFullscreen] = useState(false);
  const mapProps = useIdhMapProps(selection, onFiltersChange);
  const subtitle = `Faixas de desenvolvimento humano · ${data.filters.ano}`;

  return (
    <ProtoCard
      title={TITLE}
      subtitle={subtitle}
      kind="map"
      state={state}
      onRetry={onRetry}
      footer={IDH_CARD_FOOTER}
      bodyClassName="flex flex-col"
      actions={
        <PanelMapCardActions
          title={TITLE}
          info={IDH_CARD_INFO.map}
          imageSource={card.imageSource}
          engine={card.engine}
          disabled={!showsIdhData(state)}
          onOpenFullscreen={() => setFullscreen(true)}
        />
      }
      overlay={
        <ProtoMapFullscreen
          open={fullscreen}
          onOpenChange={setFullscreen}
          title={TITLE}
          subtitle={subtitle}
          source={FULLSCREEN_SOURCE}
          hint={PANEL_MAP_HINT}
          renderStage={(frame) => <PanelMap {...mapProps} className={frame} />}
        />
      }
    >
      <PanelMap {...mapProps} {...card.mapBinding} className={MAP_BOX_CLASS} />
    </ProtoCard>
  );
};
