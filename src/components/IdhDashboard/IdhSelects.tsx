"use client";

import { useId } from "react";
import {
  ALL_OPTION,
  FilterSelect,
} from "@/components/Panel/TerritorialFilterBar";
import {
  IDH_RECORTES,
  IDH_YEAR_RANGE,
  type IdhFilters,
  type IdhRecorte,
} from "@/features/panels/idh/idhPanel";
import { listYears } from "@/features/panels/territorialFilters";
import type { UfOption } from "@/features/panels/territorialOptions";

const YEARS = listYears(IDH_YEAR_RANGE).map((year) => ({
  value: String(year),
  label: String(year),
}));

export const IdhSelects = ({
  filters,
  ufs,
  onChange,
}: {
  filters: IdhFilters;
  ufs: UfOption[];
  onChange: (next: IdhFilters) => void;
}) => {
  const id = useId();

  return (
    <>
      <FilterSelect
        id={`${id}-ano`}
        label="Ano"
        value={String(filters.ano)}
        options={YEARS}
        onChange={(value) => onChange({ ...filters, ano: Number(value) })}
      />
      <FilterSelect
        id={`${id}-recorte`}
        label="Recorte"
        value={filters.recorte}
        options={[...IDH_RECORTES]}
        onChange={(value) =>
          onChange({ ...filters, recorte: value as IdhRecorte })
        }
      />
      <FilterSelect
        id={`${id}-uf`}
        label="Estado"
        value={filters.uf ?? ""}
        options={[
          ALL_OPTION,
          ...ufs.map((uf) => ({ value: uf.sigla, label: uf.nome })),
        ]}
        onChange={(value) => onChange({ ...filters, uf: value || undefined })}
      />
    </>
  );
};
