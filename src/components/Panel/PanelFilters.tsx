"use client";

import { Funnel, FunnelX, LoaderCircle, MapPin } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { InsideDialogContext } from "@/components/Panel/MultiSelectCombobox";
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

const CompactClearButton = ({ onClear }: { onClear: () => void }) => (
  <button
    type="button"
    onClick={onClear}
    aria-label="Limpar filtros"
    title="Limpar filtros"
    className="inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-grey-200 bg-white text-red-700 hover:bg-red-100"
  >
    <FunnelX aria-hidden className="size-5" />
  </button>
);

// Altura do cabeçalho do site (sticky): a barra do local fica logo abaixo dele.
const useSiteHeaderHeight = () => {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const header = document.querySelector("header");

    if (!header) return;
    const observer = new ResizeObserver(() => setHeight(header.offsetHeight));

    observer.observe(header);

    return () => observer.disconnect();
  }, []);

  return height;
};

const FiltersSheet = ({
  summary,
  compact = false,
  children,
}: {
  summary: string;
  compact?: boolean;
  children: ReactNode;
}) => (
  <Sheet>
    <SheetTrigger
      className={`${BUTTON_BASE} bg-green-800 text-grey-100 hover:bg-green-900 ${compact ? "h-11 flex-none px-3" : ""}`}
    >
      <Funnel aria-hidden className="size-4" />
      Filtros
    </SheetTrigger>
    <SheetContent side="bottom" className="gap-4 rounded-t-lg p-6">
      <SheetHeader className="p-0">
        <SheetTitle>Filtros</SheetTitle>
        <SheetDescription>Mostrando: {summary}</SheetDescription>
      </SheetHeader>
      <InsideDialogContext.Provider value>
        <div className="grid grid-cols-1 gap-3">{children}</div>
      </InsideDialogContext.Provider>
    </SheetContent>
  </Sheet>
);

const StickyLocation = ({
  summary,
  isPending,
  onClear,
  children,
}: {
  summary: string;
  isPending: boolean;
  onClear: () => void;
  children: ReactNode;
}) => {
  const top = useSiteHeaderHeight();

  return (
    <div
      style={{ top }}
      className="sticky z-40 -mx-6 flex items-center gap-2 border-b border-grey-200 bg-white px-4 py-2 shadow-sm lg:hidden"
    >
      <p
        aria-live="polite"
        className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-semibold text-grey-1100"
      >
        {isPending ? (
          <LoaderCircle
            aria-label="Atualizando"
            className="size-4 shrink-0 animate-spin text-green-800"
          />
        ) : (
          <MapPin aria-hidden className="size-4 shrink-0 text-green-800" />
        )}
        <span className="truncate">{summary}</span>
      </p>
      <FiltersSheet summary={summary} compact>
        {children}
      </FiltersSheet>
      <CompactClearButton onClear={onClear} />
    </div>
  );
};

// No celular os selects ficam numa gaveta aberta por "Filtros"; no desktop, em
// linha. `sticky`: no celular, uma barra com o local fica presa abaixo do cabeçalho.
export const PanelFilters = ({
  summary,
  onClear,
  sticky = false,
  isPending = false,
  children,
}: {
  summary: string;
  onClear: () => void;
  sticky?: boolean;
  isPending?: boolean;
  children: ReactNode;
}) => (
  <>
    {sticky ? (
      <StickyLocation summary={summary} isPending={isPending} onClear={onClear}>
        {children}
      </StickyLocation>
    ) : (
      <div className="flex gap-6 lg:hidden">
        <FiltersSheet summary={summary}>{children}</FiltersSheet>
        <ClearButton onClear={onClear} />
      </div>
    )}
    <div className="hidden items-end gap-3 lg:flex [&>*]:flex-1">
      {children}
      <div className="flex max-w-48">
        <ClearButton onClear={onClear} />
      </div>
    </div>
  </>
);
