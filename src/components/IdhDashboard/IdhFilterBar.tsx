"use client";

import { type ReactNode, type Ref, useId, useState } from "react";
import { IdhIcon } from "@/components/IdhDashboard/IdhIcon";
import { IdhSheet } from "@/components/IdhDashboard/IdhSheet";
import {
  BUTTON,
  BUTTON_GHOST,
  FOCUS_RING,
  IDH_TEXT,
  WRAP,
} from "@/components/IdhDashboard/idhStyles";
import { listYears } from "@/features/panels/territorialFilters";
import { cn } from "@/lib/utils";
import {
  IDH_YEAR_RANGE,
  idhPlaceName,
  type IdhFilters,
  type IdhPanelData,
} from "@/features/panels/idh/idhPanel";

const YEARS = [...listYears(IDH_YEAR_RANGE)].reverse();

// `select.sel`: 204 px no desktop, largura toda e 44 px na folha do celular.
const SELECT_CLASS = `h-10 w-full cursor-pointer appearance-none truncate rounded-[6px] border border-grey-300 bg-white pr-9 pl-3 text-sm text-grey-1100 hover:border-[#9a9598] ${FOCUS_RING}`;

const Field = ({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: (id: string) => ReactNode;
}) => {
  const id = useId();

  return (
    <div
      className={`flex flex-col gap-1 font-semibold ${wide ? "mb-3.5 text-sm" : "text-xs"}`}
    >
      <label htmlFor={id} className="leading-4">
        {label}
      </label>
      <div className={`relative ${wide ? "w-full" : "w-[204px]"}`}>
        {children(id)}
        <IdhIcon
          name="chevronDown"
          size={16}
          stroke={2.5}
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-grey-800"
        />
      </div>
    </div>
  );
};

type FilterProps = {
  data: IdhPanelData;
  onChange: (filters: IdhFilters) => void;
};

const FilterFields = ({
  data,
  onChange,
  wide,
}: FilterProps & { wide?: boolean }) => {
  const ufs = [...data.ufs].sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
  const selectClass = cn(SELECT_CLASS, wide && "h-11 text-[15px]");

  return (
    <>
      <Field label="Estado" wide={wide}>
        {(id) => (
          <select
            id={id}
            value={data.filters.uf ?? ""}
            onChange={(event) =>
              onChange({ ...data.filters, uf: event.target.value || undefined })
            }
            className={selectClass}
          >
            <option value="">Todos</option>
            {ufs.map((uf) => (
              <option key={uf.sigla} value={uf.sigla}>
                {uf.nome}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Ano" wide={wide}>
        {(id) => (
          <select
            id={id}
            value={data.filters.ano}
            onChange={(event) =>
              onChange({ ...data.filters, ano: Number(event.target.value) })
            }
            className={selectClass}
          >
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        )}
      </Field>
    </>
  );
};

// `#clearBtn`: vermelho quando há filtro; só o ícone no celular.
const CLEAR_CLASS = cn(
  BUTTON_GHOST,
  "min-h-9 px-3.5 py-1.5 text-[#bf1621] enabled:border-[#efb8bd] hover:not-disabled:border-[#efb8bd] hover:not-disabled:bg-[#ffe1e3] max-[700px]:min-h-10 max-[700px]:w-10 max-[700px]:flex-none max-[700px]:p-0",
);

const FiltersSheet = ({
  open,
  onOpenChange,
  isDefault,
  onClear,
  ...props
}: FilterProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDefault: boolean;
  onClear: () => void;
}) => (
  <IdhSheet open={open} onOpenChange={onOpenChange} title="Filtros">
    <div>
      <FilterFields {...props} wide />
    </div>
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
  </IdhSheet>
);

// No celular, o resumo do filtro abre a folha (`.fb-sum`).
const PhoneSummary = ({
  data,
  visaoLabel,
  onOpen,
}: {
  data: IdhPanelData;
  visaoLabel: string;
  onOpen: () => void;
}) => (
  <button
    type="button"
    onClick={onOpen}
    aria-label="Filtros selecionados. Toque para alterar"
    className="hidden min-w-0 flex-1 items-center gap-2 py-1 text-left max-[700px]:flex"
  >
    <IdhIcon name="pin" size={20} className="flex-none" />
    <span className="flex min-w-0 flex-col leading-tight">
      <b className="truncate text-sm font-semibold">
        {idhPlaceName(data)} · {data.filters.ano}
      </b>
      <small className="text-xs text-grey-1100">{visaoLabel}</small>
    </span>
  </button>
);

/**
 * Barra de filtros do painel (`.fb` do protótipo): Estado e Ano no desktop,
 * resumo e folha no celular, e o "Limpar filtros". Gruda no topo ao rolar.
 *
 * @example <IdhFilterBar data={panel} visaoLabel="Visão geral" onChange={apply} onClear={reset} isDefault top={80} stuck={false} barRef={ref} />
 */
export const IdhFilterBar = ({
  visaoLabel,
  onClear,
  isDefault,
  top,
  stuck,
  barRef,
  ...props
}: FilterProps & {
  visaoLabel: string;
  onClear: () => void;
  isDefault: boolean;
  top: number;
  stuck: boolean;
  barRef: Ref<HTMLDivElement>;
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div
      ref={barRef}
      style={{ top }}
      className={`${IDH_TEXT} sticky z-40 w-full border-b border-grey-300 bg-white transition-shadow duration-150 ${stuck ? "shadow-[0_6px_16px_-10px_rgba(41,40,41,0.45)]" : ""}`}
    >
      <div
        className={`${WRAP} flex min-h-[88px] items-end gap-4 py-3 max-[700px]:min-h-14 max-[700px]:items-center max-[700px]:gap-2 max-[700px]:py-2`}
      >
        <PhoneSummary
          data={props.data}
          visaoLabel={visaoLabel}
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
          <IdhIcon name="filter" size={16} stroke={2.2} />
          Filtros
        </button>
        <div className="contents max-[700px]:hidden">
          <FilterFields {...props} />
        </div>
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
          <IdhIcon name="clearFilter" size={16} stroke={2.2} />
        </button>
      </div>
      <FiltersSheet
        {...props}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        isDefault={isDefault}
        onClear={onClear}
      />
    </div>
  );
};
