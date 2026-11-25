"use client";

import { type ReactNode, useContext } from "react";
import { ProtoCardInfo } from "@/components/ProtoPanel/ProtoCardInfo";
import {
  ProtoCardMenu,
  ProtoCardMenuContext,
} from "@/components/ProtoPanel/ProtoCardMenu";
import { ProtoFullscreenButton } from "@/components/ProtoPanel/ProtoMapControls";
import {
  buildMapPoster,
  type MapPosterCardInput,
} from "@/features/panels/mapPosterBuild";
import type { PanelMapEngine } from "@/lib/panelMapEngine";

// A imagem do mapa leva o crédito do basemap ativo; os outros cards do painel
// seguem com a fonte do contexto. O cartaz junta o que o painel deu no contexto
// (`menu.poster`) ao que o card informa (`poster`); sem um dos dois, não há
// cartaz e a imagem sai como antes.
const MapCardMenu = ({
  engine,
  title,
  imageSource,
  poster,
}: {
  engine: PanelMapEngine | null;
  title: string;
  imageSource: string;
  poster?: MapPosterCardInput;
}) => {
  const menu = useContext(ProtoCardMenuContext);
  const base = menu?.poster;
  const chart = {
    getSource: () => engine?.toImageSource() ?? null,
    getPoster: base && poster ? () => buildMapPoster(base, poster) : undefined,
  };

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
 * `poster`: o que o card informa ao cartaz de download (indicador, fonte,
 * recorte, geodados).
 *
 * @example <PanelMapCardActions title="Mapa" info="…" imageSource={card.imageSource} engine={card.engine} poster={posterInput} disabled={false} onOpenFullscreen={open} />
 */
export const PanelMapCardActions = ({
  title,
  info,
  imageSource,
  engine,
  poster,
  disabled,
  onOpenFullscreen,
}: {
  title: string;
  info: ReactNode;
  imageSource: string;
  engine: PanelMapEngine | null;
  poster?: MapPosterCardInput;
  disabled: boolean;
  onOpenFullscreen: () => void;
}) => (
  <>
    <ProtoFullscreenButton disabled={disabled} onClick={onOpenFullscreen} />
    <ProtoCardInfo title={title} text={info} />
    <MapCardMenu
      engine={engine}
      title={title}
      imageSource={imageSource}
      poster={poster}
    />
  </>
);
