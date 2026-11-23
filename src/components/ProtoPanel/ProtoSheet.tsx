"use client";

import type { ReactNode } from "react";
import { ProtoIcon } from "@/components/ProtoPanel/ProtoIcon";
import {
  FOCUS_RING,
  protoToneStyle,
} from "@/components/ProtoPanel/protoStyles";
import { useProtoTone } from "@/components/ProtoPanel/protoTone";
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogUnstyledContent,
} from "@/components/ui/dialog";

// `.sheet` do protótipo: sobe de baixo, com a alça no topo. O diálogo do Radix
// cuida do foco preso, do Esc e do fundo escurecido.
// INTENTIONAL: o conteúdo é o `DialogUnstyledContent` (o Content do Radix
// puro, exposto por ui/dialog), não o `DialogContent` do shadcn (centralizado,
// com zoom) com classes que anulam as dele, que quebrariam sem aviso ao
// regenerar a primitiva. O `ui/sheet.tsx` também não serve: desenha sempre um
// cabeçalho fixo de 80 px com o X à esquerda, diferente da folha do protótipo
// (revisão da PR #397).
const SHEET_CLASS =
  "fixed inset-x-0 bottom-0 z-50 grid max-h-[88vh] w-full overflow-auto rounded-t-2xl bg-white px-4 pb-5 shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.25)] data-[state=open]:animate-proto-sheet-in data-[state=closed]:animate-proto-sheet-out motion-reduce:animate-none!";

const SCRIM_CLASS =
  "data-[state=open]:animate-proto-scrim-in data-[state=closed]:animate-proto-scrim-out motion-reduce:animate-none!";

/**
 * Folha inferior do celular (filtros, ⓘ e menu dos cards), como no protótipo.
 * Vai para um portal, então recebe o tom do painel no próprio `style`.
 * Com `bare`, mostra só o conteúdo (sem alça, título e ✕): o título continua
 * como nome acessível, oculto.
 *
 * @example <ProtoSheet open={open} onOpenChange={setOpen} title="Filtros">…</ProtoSheet>
 */
export const ProtoSheet = ({
  open,
  onOpenChange,
  title,
  bare = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  bare?: boolean;
  children: ReactNode;
}) => {
  const tone = useProtoTone();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className={SCRIM_CLASS} />
        <DialogUnstyledContent
          aria-describedby={undefined}
          style={protoToneStyle(tone)}
          className={`${SHEET_CLASS} ${bare ? "pt-2" : "pt-0"}`}
        >
          {bare ? (
            <DialogTitle className="sr-only">{title}</DialogTitle>
          ) : (
            <div className="relative flex items-center justify-between pt-5 pb-3 before:absolute before:top-2 before:left-1/2 before:-ml-[18px] before:h-1 before:w-9 before:rounded-[2px] before:bg-grey-300">
              <DialogTitle className="text-lg leading-6 font-semibold text-grey-1100">
                {title}
              </DialogTitle>
              <DialogClose
                aria-label="Fechar"
                className={`-mr-2 grid size-10 place-items-center rounded-[6px] hover:bg-grey-100 ${FOCUS_RING}`}
              >
                <ProtoIcon name="close" size={20} stroke={2.2} />
              </DialogClose>
            </div>
          )}
          {children}
        </DialogUnstyledContent>
      </DialogPortal>
    </Dialog>
  );
};
