"use client";

import { type ReactNode, type Ref, useState } from "react";
import {
  ProtoIcon,
  type ProtoIconName,
} from "@/components/ProtoPanel/ProtoIcon";
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

// `#clearBtn`: vermelho quando há filtro; só o ícone no celular (com
// `brandInBar`, já a partir de 900 px, como no protótipo do IDH).
const CLEAR_CLASS = cn(
  BUTTON_GHOST,
  "min-h-9 px-3.5 py-1.5 text-[#bf1621] enabled:border-[#efb8bd] hover:not-disabled:border-[#efb8bd] hover:not-disabled:bg-[#ffe1e3] max-[700px]:min-h-10 max-[700px]:w-10 max-[700px]:flex-none max-[700px]:p-0",
);
const CLEAR_COMPACT_CLASS =
  "max-[900px]:min-h-10 max-[900px]:w-10 max-[900px]:flex-none max-[900px]:p-0";

// Ícone e nome do painel no resumo do celular (`.fb-tile` do protótipo).
export type ProtoFilterBarBrand = { icon: ProtoIconName; title: string };

export type ProtoFilterBarProps = {
  summaryTitle: string;
  brand?: ProtoFilterBarBrand;

  // Também põe a `brand` no início da barra do desktop (`.fb-id`, IDH).
  // "compact": barra com quatro campos (perfil demográfico), em que o nome
  // some até 900 px e fica só o ícone (`.fb-in:has(>.fl:nth-of-type(4))`).
  brandInBar?: boolean | "compact";

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

const BrandTile = ({ icon }: { icon: ProtoIconName }) => (
  <span
    aria-hidden="true"
    className="grid size-8 flex-none place-items-center rounded-[6px] bg-(--proto-accent) text-white"
  >
    <ProtoIcon name={icon} size={18} />
  </span>
);

const BarBrand = ({
  brand,
  compact,
}: {
  brand: ProtoFilterBarBrand;
  compact: boolean;
}) => (
  <div
    className={cn(
      "flex h-10 min-w-0 flex-[0_1_auto] items-center gap-2.5 border-r border-grey-300 pr-4 max-[700px]:hidden",
      compact && "max-[900px]:pr-3",
    )}
  >
    <BrandTile icon={brand.icon} />
    <span
      className={cn(
        "line-clamp-2 max-w-[220px] min-w-0 text-[15px] leading-5 font-bold",
        compact && "max-[900px]:hidden",
      )}
    >
      {brand.title}
    </span>
  </div>
);

// No celular, o resumo do filtro abre a folha (`.fb-sum`).
// Com `brand`, o nome do painel vira o título e o recorte desce para baixo.
const PhoneSummary = ({
  title,
  subtitle,
  brand,
  onOpen,
}: {
  title: string;
  subtitle?: string;
  brand?: ProtoFilterBarBrand;
  onOpen: () => void;
}) =>
  brand ? (
    <PhoneBrandSummary brand={brand} place={title} onOpen={onOpen} />
  ) : (
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

const PhoneBrandSummary = ({
  brand,
  place,
  onOpen,
}: {
  brand: ProtoFilterBarBrand;
  place: string;
  onOpen: () => void;
}) => (
  <button
    type="button"
    onClick={onOpen}
    aria-label="Filtros selecionados. Toque para alterar"
    className="hidden min-w-0 flex-1 items-center gap-2 py-1 text-left max-[700px]:flex"
  >
    <BrandTile icon={brand.icon} />
    <span className="flex min-w-0 flex-col">
      <b className="truncate text-[15px] leading-5 font-bold">{brand.title}</b>
      <small className="truncate text-[12.5px] leading-4 text-grey-800">
        {place}
      </small>
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
  brand,
  brandInBar = false,
  renderFields,
  isDefault,
  onClear,
  top,
  stuck,
  barRef,
}: ProtoFilterBarProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const tone = useProtoTone();
  const barBrand = brandInBar ? brand : undefined;

  return (
    <div
      ref={barRef}
      style={{ top, ...protoToneStyle(tone) }}
      className={`${PROTO_TEXT} sticky z-40 w-full border-b border-grey-300 bg-white transition-shadow duration-150 ${stuck ? "shadow-[0_6px_16px_-10px_rgba(41,40,41,0.45)]" : ""}`}
    >
      <div
        className={cn(
          WRAP,
          "flex min-h-[88px] items-end gap-4 py-3 max-[700px]:min-h-14 max-[700px]:items-center max-[700px]:gap-2 max-[700px]:py-2",
          barBrand && "max-[900px]:gap-3 max-[700px]:gap-2",
        )}
      >
        {barBrand ? (
          <BarBrand brand={barBrand} compact={brandInBar === "compact"} />
        ) : null}
        <PhoneSummary
          title={summaryTitle}
          subtitle={summarySubtitle}
          brand={brand}
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
        {barBrand ? null : <div className="flex-1 max-[700px]:hidden" />}
        <button
          type="button"
          disabled={isDefault}
          onClick={onClear}
          aria-label="Limpar filtros"
          title="Limpar filtros"
          className={cn(CLEAR_CLASS, barBrand && CLEAR_COMPACT_CLASS)}
        >
          <span
            className={cn(
              "max-[700px]:hidden",
              barBrand && "max-[900px]:hidden",
            )}
          >
            Limpar filtros
          </span>
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
