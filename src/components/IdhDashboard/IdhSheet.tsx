"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { IdhIcon } from "@/components/IdhDashboard/IdhIcon";
import { FOCUS_RING } from "@/components/IdhDashboard/idhStyles";
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";

// `.sheet` do protótipo: sobe de baixo, com a alça no topo. O diálogo do Radix
// cuida do foco preso, do Esc e do fundo escurecido.
// INTENTIONAL: o conteúdo é o `DialogPrimitive.Content` puro, não o
// `DialogContent` do shadcn (centralizado, com zoom) com classes que anulam as
// dele, que quebrariam sem aviso ao regenerar a primitiva. O `ui/sheet.tsx`
// também não serve: desenha sempre um cabeçalho fixo de 80 px com o X à
// esquerda, diferente da folha do protótipo (revisão da PR #397).
const SHEET_CLASS =
  "fixed inset-x-0 bottom-0 z-50 grid max-h-[88vh] w-full overflow-auto rounded-t-2xl bg-white px-4 pt-0 pb-5 shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.25)] duration-250 data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom";

/**
 * Folha inferior do celular (filtros, ⓘ e menu dos cards), como no protótipo.
 *
 * @example <IdhSheet open={open} onOpenChange={setOpen} title="Filtros">…</IdhSheet>
 */
export const IdhSheet = ({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        aria-describedby={undefined}
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
            <IdhIcon name="close" size={20} stroke={2.2} />
          </DialogClose>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  </Dialog>
);
