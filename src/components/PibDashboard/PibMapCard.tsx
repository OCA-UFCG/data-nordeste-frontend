"use client";

import { useCallback, useContext, useMemo, useState } from "react";
import { PanelMap, type PanelMapProps } from "@/components/PanelMap/PanelMap";
import type { PibCardProps } from "@/components/PibDashboard/pibCardProps";
import {
  PIB_CARD_FOOTER,
  PIB_CARD_INFO,
  PIB_MAP_HINT,
  PIB_MAP_IMAGE_SOURCE,
  PIB_MAP_TITLE,
} from "@/components/PibDashboard/pibTexts";
import { ProtoCard } from "@/components/ProtoPanel/ProtoCard";
import { ProtoCardInfo } from "@/components/ProtoPanel/ProtoCardInfo";
import {
  ProtoCardMenu,
  ProtoCardMenuContext,
} from "@/components/ProtoPanel/ProtoCardMenu";
import { ProtoIcon } from "@/components/ProtoPanel/ProtoIcon";
import { ProtoMapFullscreen } from "@/components/ProtoPanel/ProtoMapFullscreen";
import { ICON_BUTTON } from "@/components/ProtoPanel/protoStyles";
import {
  recorteToTerritorial,
  territorialToRecorte,
} from "@/features/panelMap/panelMapAdapters";
import { formatPibReais } from "@/features/panels/pib/pibFormat";
import { areaLabel } from "@/features/panels/territorialOptions";
import type { TerritorialFilters } from "@/features/panels/territorialFilters";
import type { PanelMapEngine } from "@/lib/panelMapEngine";

// Altura fixa: o mapa preenche o card ao lado da coluna dos setores sem
// depender da proporção da malha.
const MAP_BOX_CLASS =
  "h-[480px] overflow-hidden rounded-[8px] max-[1000px]:h-[400px]";

type PibMapSelectionProps = Pick<
  PanelMapProps,
  | "indicator"
  | "ano"
  | "area"
  | "recorte"
  | "deepest"
  | "formatValue"
  | "label"
  | "onRecorteChange"
>;

// IMPORTANT: o recorte vem direto de `selection` e volta direto para o
// `request`. O PanelMap só evita reenquadrar se o recorte que recebe depois
// for igual ao que emitiu; normalizar em qualquer ponto do caminho faria o
// mapa "pular" a cada zoom.
const usePibMapProps = (
  selection: TerritorialFilters,
  onFiltersChange: (filters: TerritorialFilters) => void,
): PibMapSelectionProps => {
  const recorte = useMemo(() => territorialToRecorte(selection), [selection]);
  const onRecorteChange = useCallback(
    (next: Parameters<PanelMapProps["onRecorteChange"]>[0]) =>
      onFiltersChange(recorteToTerritorial(selection, next)),
    [selection, onFiltersChange],
  );

  return {
    indicator: "pib",
    ano: selection.ano,
    area: selection.area,
    recorte,
    deepest: "municipio",
    formatValue: formatPibReais,
    label: PIB_MAP_TITLE,
    onRecorteChange,
  };
};

const FullscreenButton = ({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    aria-haspopup="dialog"
    aria-label="Abrir mapa em tela cheia"
    title="Tela cheia"
    disabled={disabled}
    onClick={onClick}
    className={ICON_BUTTON}
  >
    <ProtoIcon name="fullscreen" size={18} stroke={1.7} />
  </button>
);

// A imagem do mapa leva o crédito do Esri; os outros cards do painel seguem
// com a fonte do contexto.
const MapCardMenu = ({ engine }: { engine: PanelMapEngine | null }) => {
  const menu = useContext(ProtoCardMenuContext);
  const chart = { getSource: () => engine?.toImageSource() ?? null };

  return (
    <ProtoCardMenuContext.Provider
      value={menu && { ...menu, imageSource: PIB_MAP_IMAGE_SOURCE }}
    >
      <ProtoCardMenu title={PIB_MAP_TITLE} chart={chart} />
    </ProtoCardMenuContext.Provider>
  );
};

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
  const [engine, setEngine] = useState<PanelMapEngine | null>(null);
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
          source={PIB_MAP_IMAGE_SOURCE}
          hint={PIB_MAP_HINT}
          renderStage={() => <PanelMap {...mapProps} />}
        />
      }
      actions={
        <>
          <FullscreenButton
            disabled={state === "loading" || state === "error"}
            onClick={() => setFullscreen(true)}
          />
          <ProtoCardInfo title={PIB_MAP_TITLE} text={PIB_CARD_INFO.map} />
          <MapCardMenu engine={engine} />
        </>
      }
    >
      <div className={MAP_BOX_CLASS}>
        <PanelMap {...mapProps} onEngine={setEngine} />
      </div>
    </ProtoCard>
  );
};
