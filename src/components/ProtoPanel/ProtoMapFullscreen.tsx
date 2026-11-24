"use client";

import type { ReactNode } from "react";
import {
  ICON_BUTTON,
  protoToneStyle,
} from "@/components/ProtoPanel/protoStyles";
import { useProtoTone } from "@/components/ProtoPanel/protoTone";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

// Moldura do palco: altura do mapa e cantos. O painel a aplica só na caixa do
// mapa (`renderStage`), para a legenda dele ficar abaixo, fora do
// `overflow-hidden`.
export const MAP_STAGE_FRAME =
  "relative h-[min(640px,calc(100vh-250px))] min-h-[300px] overflow-hidden rounded-[8px] max-[700px]:h-auto max-[700px]:flex-1";

export type ProtoMapFullscreenProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle: string;
  legend?: ReactNode;

  // Fonte exibida no rodapé do diálogo.
  source: string;

  // Dica de uso no rodapé; sem ela, o rodapé não mostra a dica.
  hint?: string;

  // O palco é do painel (o mapa de municípios, que tem o próprio zoom).
  // Recebe `MAP_STAGE_FRAME`.
  renderStage: (frameClassName: string) => ReactNode;
};

// Só existe com o diálogo aberto: cada abertura monta o mapa de novo.
const FullscreenContent = ({
  title,
  subtitle,
  legend,
  source,
  hint,
  renderStage,
}: Omit<ProtoMapFullscreenProps, "open" | "onOpenChange">) => {
  const tone = useProtoTone();

  return (
    <DialogContent
      showCloseButton={false}
      style={protoToneStyle(tone)}
      className="flex max-h-full w-[min(1200px,calc(100%-48px))] max-w-none flex-col gap-0 rounded-[12px] border-0 bg-white px-4 pt-5 pb-3 shadow-[0_12px_32px_rgba(0,0,0,0.25)] sm:max-w-none max-[700px]:inset-0 max-[700px]:h-full max-[700px]:w-full max-[700px]:translate-x-0 max-[700px]:translate-y-0 max-[700px]:rounded-none max-[700px]:p-3"
    >
      <div className="mx-1 mb-3 flex items-start justify-between gap-2">
        <div>
          <DialogTitle className="text-lg font-semibold text-grey-1100">
            {title}
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-[13px] text-grey-800">
            {subtitle}
          </DialogDescription>
        </div>
        <DialogClose
          aria-label="Fechar tela cheia"
          title="Fechar (Esc)"
          className={ICON_BUTTON}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" />
          </svg>
        </DialogClose>
      </div>
      <div className="flex min-h-0 flex-col max-[700px]:flex-1">
        {renderStage(MAP_STAGE_FRAME)}
      </div>
      {legend ? <div className="mx-1 mt-3">{legend}</div> : null}
      <div className="mx-1 mt-3 flex justify-between gap-3 border-t border-grey-200 pt-3 text-[13px] text-grey-800">
        <span>{source}</span>
        {hint ? <span className="max-[700px]:hidden">{hint}</span> : null}
      </div>
    </DialogContent>
  );
};

/**
 * Tela cheia de um card de mapa (`.mmodal` do protótipo): cabeçalho com o
 * título e o botão de fechar, o palco do painel (`renderStage`), a legenda
 * opcional e o rodapé com a fonte e a dica de uso (`hint`). O palco recebe só
 * a classe da caixa do mapa (`frameClassName`); a legenda do painel fica
 * abaixo dela.
 *
 * @example <ProtoMapFullscreen open={open} onOpenChange={setOpen} title="Mapa" subtitle="…" source={PIB_CARD_SOURCE} hint={PANEL_MAP_HINT} renderStage={(frame) => <PanelMap {...mapProps} className={frame} />} />
 */
export const ProtoMapFullscreen = ({
  open,
  onOpenChange,
  ...content
}: ProtoMapFullscreenProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    {open ? <FullscreenContent {...content} /> : null}
  </Dialog>
);
