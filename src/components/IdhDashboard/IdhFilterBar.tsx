"use client";

import type { Ref } from "react";
import { ProtoFilterBar } from "@/components/ProtoPanel/ProtoFilterBar";
import {
  ProtoSelectField,
  protoSelectClass,
} from "@/components/ProtoPanel/ProtoSelectField";
import { listYears } from "@/features/panels/territorialFilters";
import {
  IDH_YEAR_RANGE,
  idhPlaceName,
  type IdhFilters,
  type IdhPanelData,
} from "@/features/panels/idh/idhPanel";

const YEARS = [...listYears(IDH_YEAR_RANGE)].reverse();

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
  const selectClass = protoSelectClass(wide);

  return (
    <>
      <ProtoSelectField label="Estado" wide={wide}>
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
      </ProtoSelectField>
      <ProtoSelectField label="Ano" wide={wide}>
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
      </ProtoSelectField>
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
