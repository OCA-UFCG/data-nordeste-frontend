"use client";

import { type ReactNode, useContext } from "react";
import { ProtoCardInfo } from "@/components/ProtoPanel/ProtoCardInfo";
import {
  ProtoCardMenu,
  ProtoCardMenuContext,
} from "@/components/ProtoPanel/ProtoCardMenu";
import { ProtoFullscreenButton } from "@/components/ProtoPanel/ProtoMapControls";
import type { PanelMapEngine } from "@/lib/panelMapEngine";

// A imagem do mapa leva o crédito do basemap ativo; os outros cards do painel
// seguem com a fonte do contexto.
const MapCardMenu = ({
  engine,
  title,
  imageSource,
}: {
  engine: PanelMapEngine | null;
  title: string;
  imageSource: string;
}) => {
  const menu = useContext(ProtoCardMenuContext);
  const chart = { getSource: () => engine?.toImageSource() ?? null };

  return (
    <ProtoCardMenuContext.Provider value={menu && { ...menu, imageSource }}>
      <ProtoCardMenu title={title} chart={chart} />
    </ProtoCardMenuContext.Provider>
  );
};

/**
 * Ações do cabeçalho do card com mapa MapLibre: tela cheia, ⓘ e o menu, cuja
 * imagem baixada vem do motor do mapa com o crédito do basemap ativo.
 *
 * @example <PanelMapCardActions title="Mapa" info="…" imageSource={card.imageSource} engine={card.engine} disabled={false} onOpenFullscreen={open} />
 */
export const PanelMapCardActions = ({
  title,
  info,
  imageSource,
  engine,
  disabled,
  onOpenFullscreen,
}: {
  title: string;
  info: ReactNode;
  imageSource: string;
  engine: PanelMapEngine | null;
  disabled: boolean;
  onOpenFullscreen: () => void;
}) => (
  <>
    <ProtoFullscreenButton disabled={disabled} onClick={onOpenFullscreen} />
    <ProtoCardInfo title={title} text={info} />
    <MapCardMenu engine={engine} title={title} imageSource={imageSource} />
  </>
);
