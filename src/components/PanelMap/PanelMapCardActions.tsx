"use client";

import { useContext } from "react";
import { ProtoCardInfo } from "@/components/ProtoPanel/ProtoCardInfo";
import {
  ProtoCardMenu,
  ProtoCardMenuContext,
} from "@/components/ProtoPanel/ProtoCardMenu";
import { ProtoIcon } from "@/components/ProtoPanel/ProtoIcon";
import { ICON_BUTTON } from "@/components/ProtoPanel/protoStyles";
import type { PanelMapEngine } from "@/lib/panelMapEngine";

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
 * imagem baixada vem do motor do mapa com o crédito do Esri.
 *
 * @example <PanelMapCardActions title="Mapa" info="…" imageSource={panelMapImageSource(SOURCE)} engine={engine} disabled={false} onOpenFullscreen={open} />
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
  info: string;
  imageSource: string;
  engine: PanelMapEngine | null;
  disabled: boolean;
  onOpenFullscreen: () => void;
}) => (
  <>
    <FullscreenButton disabled={disabled} onClick={onOpenFullscreen} />
    <ProtoCardInfo title={title} text={info} />
    <MapCardMenu engine={engine} title={title} imageSource={imageSource} />
  </>
);
