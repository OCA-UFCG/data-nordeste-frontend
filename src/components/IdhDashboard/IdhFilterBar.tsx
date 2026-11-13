"use client";

import { type ReactNode, type Ref, useId } from "react";
import { ProtoIcon } from "@/components/ProtoPanel/ProtoIcon";
import { ProtoFilterBar } from "@/components/ProtoPanel/ProtoFilterBar";
import { FOCUS_RING } from "@/components/ProtoPanel/protoStyles";
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
        <ProtoIcon
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

/**
 * Barra de filtros do painel de IDH: Estado e Ano; o resto (resumo no celular,
 * folha, "Limpar filtros" e o gruda-no-topo) é a `ProtoFilterBar`.
 *
 * @example <IdhFilterBar data={panel} visaoLabel="Visão geral" onChange={apply} onClear={reset} isDefault top={80} stuck={false} barRef={ref} />
 */
export const IdhFilterBar = ({
  data,
  onChange,
  visaoLabel,
  onClear,
  isDefault,
  top,
  stuck,
  barRef,
}: FilterProps & {
  visaoLabel: string;
  onClear: () => void;
  isDefault: boolean;
  top: number;
  stuck: boolean;
  barRef: Ref<HTMLDivElement>;
}) => (
  <ProtoFilterBar
    summaryTitle={`${idhPlaceName(data)} · ${data.filters.ano}`}
    summarySubtitle={visaoLabel}
    renderFields={(wide) => (
      <FilterFields data={data} onChange={onChange} wide={wide} />
    )}
    isDefault={isDefault}
    onClear={onClear}
    top={top}
    stuck={stuck}
    barRef={barRef}
  />
);
