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
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

// `.sheet` do protótipo: sobe de baixo, com a alça no topo. O diálogo do Radix
// cuida do foco preso, do Esc e do fundo escurecido.
const SHEET_CLASS =
  "top-auto bottom-0 left-0 grid max-h-[88vh] w-full max-w-none translate-x-0 translate-y-0 gap-0 overflow-auto rounded-t-2xl rounded-b-none border-0 bg-white px-4 pt-0 pb-5 shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.25)] duration-250 sm:max-w-none data-[state=closed]:slide-out-to-bottom data-[state=closed]:zoom-out-100 data-[state=open]:slide-in-from-bottom data-[state=open]:zoom-in-100";

/**
 * Folha inferior do celular (filtros, ⓘ e menu dos cards), como no protótipo.
 * Vai para um portal, então recebe o tom do painel no próprio `style`.
 *
 * @example <ProtoSheet open={open} onOpenChange={setOpen} title="Filtros">…</ProtoSheet>
 */
export const ProtoSheet = ({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}) => {
  const tone = useProtoTone();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        style={protoToneStyle(tone)}
        className={SHEET_CLASS}
      >
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
        {children}
      </DialogContent>
    </Dialog>
  );
};
