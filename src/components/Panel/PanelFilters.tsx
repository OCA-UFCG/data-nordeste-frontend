"use client";

import { Funnel, FunnelX } from "lucide-react";
import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const BUTTON_BASE =
  "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium lg:h-11";

const ClearButton = ({ onClear }: { onClear: () => void }) => (
  <button
    type="button"
    onClick={onClear}
    className={`${BUTTON_BASE} border border-grey-200 bg-white text-red-700 hover:bg-red-100`}
  >
    Limpar filtros
    <FunnelX aria-hidden className="size-4" />
  </button>
);

// No celular os selects ficam numa gaveta aberta por "Filtros" (Figma mobile);
// no desktop aparecem em linha, com "Limpar filtros" ao lado.
export const PanelFilters = ({
  summary,
  onClear,
  children,
}: {
  summary: string;
  onClear: () => void;
  children: ReactNode;
}) => (
  <>
    <div className="flex gap-6 lg:hidden">
      <Sheet>
        <SheetTrigger
          className={`${BUTTON_BASE} bg-green-800 text-grey-100 hover:bg-green-900`}
        >
          <Funnel aria-hidden className="size-4" />
          Filtros
        </SheetTrigger>
        <SheetContent side="bottom" className="gap-4 rounded-t-lg p-6">
          <SheetHeader className="p-0">
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>Mostrando: {summary}</SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-1 gap-3">{children}</div>
        </SheetContent>
      </Sheet>
      <ClearButton onClear={onClear} />
    </div>
    <div className="hidden items-end gap-3 lg:flex [&>*]:flex-1">
      {children}
      <div className="flex max-w-48">
        <ClearButton onClear={onClear} />
      </div>
    </div>
  </>
);
