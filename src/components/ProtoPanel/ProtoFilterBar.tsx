"use client";

import { type ReactNode, type Ref, useState } from "react";
import { ProtoIcon } from "@/components/ProtoPanel/ProtoIcon";
import { ProtoSheet } from "@/components/ProtoPanel/ProtoSheet";
import {
  BUTTON,
  BUTTON_GHOST,
  PROTO_TEXT,
  protoToneStyle,
  WRAP,
} from "@/components/ProtoPanel/protoStyles";
import { useProtoTone } from "@/components/ProtoPanel/protoTone";
import { cn } from "@/lib/utils";

// `#clearBtn`: vermelho quando há filtro; só o ícone no celular.
const CLEAR_CLASS = cn(
  BUTTON_GHOST,
  "min-h-9 px-3.5 py-1.5 text-[#bf1621] enabled:border-[#efb8bd] hover:not-disabled:border-[#efb8bd] hover:not-disabled:bg-[#ffe1e3] max-[700px]:min-h-10 max-[700px]:w-10 max-[700px]:flex-none max-[700px]:p-0",
);

export type ProtoFilterBarProps = {
  summaryTitle: string;

  // Sem subtítulo, o resumo do celular mostra só o título (perfil demográfico).
  summarySubtitle?: string;
  renderFields: (wide: boolean) => ReactNode;
  isDefault: boolean;
  onClear: () => void;
  top: number;
  stuck: boolean;
  barRef: Ref<HTMLDivElement>;
};

const FiltersSheet = ({
  open,
  onOpenChange,
  renderFields,
  isDefault,
  onClear,
}: Pick<ProtoFilterBarProps, "renderFields" | "isDefault" | "onClear"> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => (
  <ProtoSheet open={open} onOpenChange={onOpenChange} title="Filtros">
    <div>{renderFields(true)}</div>
    <div className="mt-5 grid grid-cols-2 gap-3">
      <button
        type="button"
        disabled={isDefault}
        onClick={onClear}
        className={cn(
          BUTTON_GHOST,
          "min-h-11 text-[15px] enabled:text-[#bf1621]",
        )}
      >
        Limpar
      </button>
      <button
        type="button"
        onClick={() => onOpenChange(false)}
        className={cn(BUTTON, "min-h-11 text-[15px]")}
      >
        Aplicar
      </button>
    </div>
  </ProtoSheet>
);

// No celular, o resumo do filtro abre a folha (`.fb-sum`).
const PhoneSummary = ({
  title,
  subtitle,
  onOpen,
}: {
  title: string;
  subtitle?: string;
  onOpen: () => void;
}) => (
  <button
    type="button"
    onClick={onOpen}
    aria-label="Filtros selecionados. Toque para alterar"
    className="hidden min-w-0 flex-1 items-center gap-2 py-1 text-left max-[700px]:flex"
  >
    <ProtoIcon name="pin" size={20} className="flex-none" />
    <span className="flex min-w-0 flex-col leading-tight">
      <b className="truncate text-sm font-semibold">{title}</b>
      {subtitle ? (
        <small className="text-xs text-grey-1100">{subtitle}</small>
      ) : null}
    </span>
  </button>
);

/**
 * Barra de filtros de um painel (`.fb` do protótipo): os campos no desktop,
 * resumo e folha no celular, e o "Limpar filtros". Gruda no topo ao rolar. Os
 * campos de cada painel entram por `renderFields(wide)`.
 *
 * @example <ProtoFilterBar summaryTitle="Pernambuco · 2021" summarySubtitle="Visão geral" renderFields={(wide) => <Fields wide={wide} />} isDefault={false} onClear={reset} top={80} stuck={false} barRef={ref} />
 */
export const ProtoFilterBar = ({
  summaryTitle,
  summarySubtitle,
  renderFields,
  isDefault,
  onClear,
  top,
  stuck,
  barRef,
}: ProtoFilterBarProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const tone = useProtoTone();

  return (
    <div
      ref={barRef}
      style={{ top, ...protoToneStyle(tone) }}
      className={`${PROTO_TEXT} sticky z-40 w-full border-b border-grey-300 bg-white transition-shadow duration-150 ${stuck ? "shadow-[0_6px_16px_-10px_rgba(41,40,41,0.45)]" : ""}`}
    >
      <div
        className={`${WRAP} flex min-h-[88px] items-end gap-4 py-3 max-[700px]:min-h-14 max-[700px]:items-center max-[700px]:gap-2 max-[700px]:py-2`}
      >
        <PhoneSummary
          title={summaryTitle}
          subtitle={summarySubtitle}
          onOpen={() => setSheetOpen(true)}
        />
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className={cn(
            BUTTON,
            "hidden flex-none px-[18px] max-[700px]:inline-flex",
          )}
        >
          <ProtoIcon name="filter" size={16} stroke={2.2} />
          Filtros
        </button>
        <div className="contents max-[700px]:hidden">{renderFields(false)}</div>
        <div className="flex-1 max-[700px]:hidden" />
        <button
          type="button"
          disabled={isDefault}
          onClick={onClear}
          aria-label="Limpar filtros"
          title="Limpar filtros"
          className={CLEAR_CLASS}
        >
          <span className="max-[700px]:hidden">Limpar filtros</span>
          <ProtoIcon name="clearFilter" size={16} stroke={2.2} />
        </button>
      </div>
      <FiltersSheet
        renderFields={renderFields}
        isDefault={isDefault}
        onClear={onClear}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
};
