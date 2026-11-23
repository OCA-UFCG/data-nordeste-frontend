"use client";

import type { Ref } from "react";
import { ProtoFilterBar } from "@/components/ProtoPanel/ProtoFilterBar";
import {
  ProtoSelectField,
  protoSelectClass,
} from "@/components/ProtoPanel/ProtoSelectField";
import { cn } from "@/lib/utils";
import { listYears } from "@/features/panels/territorialFilters";
import {
  idhPlaceName,
  type IdhFilters,
  type IdhPanelData,
} from "@/features/panels/idh/idhPanel";

const IDENTITY = { name: "IDH", icon: "idh" } as const;

// `.fb .fb-in>.fl`: Estado e Ano dividem a barra; até 900 px o select aperta a
// folga da seta.
const BAR_FIELD_CLASS = "max-w-none min-w-0 max-[900px]:[&>div>svg]:right-2";
const BAR_SELECT_CLASS = "max-[900px]:pr-7 max-[900px]:pl-2.5";

// `selection`: os filtros pedidos, que os selects mostram já antes de o
// servidor responder (e de onde parte o próximo filtro).
type FilterProps = {
  data: IdhPanelData;
  selection: IdhFilters;
  onChange: (filters: IdhFilters) => void;
};

const FilterFields = ({
  data,
  selection,
  onChange,
  wide,
}: FilterProps & { wide?: boolean }) => {
  const ufs = [...data.ufs].sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
  const years = [...listYears(data.yearRange)].reverse();
  const selectClass = cn(protoSelectClass(wide), !wide && BAR_SELECT_CLASS);
  const field = wide ? { wide } : { fluid: true, className: BAR_FIELD_CLASS };

  return (
    <>
      <ProtoSelectField label="Estado" {...field}>
        {(id) => (
          <select
            id={id}
            value={selection.uf ?? ""}
            onChange={(event) =>
              onChange({ ...selection, uf: event.target.value || undefined })
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
      </ProtoSelectField>
      <ProtoSelectField label="Ano" {...field}>
        {(id) => (
          <select
            id={id}
            value={selection.ano}
            onChange={(event) =>
              onChange({ ...selection, ano: Number(event.target.value) })
            }
            className={selectClass}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        )}
      </ProtoSelectField>
    </>
  );
};

/**
 * Barra de filtros do painel de IDH: o nome do painel, Estado e Ano; o resto
 * (resumo no celular, folha, "Limpar filtros" e o gruda-no-topo) é a
 * `ProtoFilterBar`.
 *
 * @example <IdhFilterBar data={panel} selection={panel.filters} visaoLabel="Visão geral" onChange={apply} onClear={reset} isDefault top={80} stuck={false} barRef={ref} />
 */
export const IdhFilterBar = ({
  data,
  selection,
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
    identity={IDENTITY}
    summaryTitle={IDENTITY.name}
    summarySubtitle={`${idhPlaceName({ ufs: data.ufs, filters: selection })} · ${selection.ano} · ${visaoLabel}`}
    renderFields={(wide) => (
      <FilterFields
        data={data}
        selection={selection}
        onChange={onChange}
        wide={wide}
      />
    )}
    isDefault={isDefault}
    onClear={onClear}
    top={top}
    stuck={stuck}
    barRef={barRef}
  />
);
