"use client";

import { useId } from "react";
import {
  ALL_OPTION,
  FilterSelect,
} from "@/components/Panel/filters/TerritorialFilterBar";
import type { IdhFilters } from "@/features/panels/idh/idhPanel";
import {
  listYears,
  type YearRange,
} from "@/features/panels/territorialFilters";
import type { UfOption } from "@/features/panels/territorialOptions";

export const IdhSelects = ({
  filters,
  yearRange,
  ufs,
  onChange,
}: {
  filters: IdhFilters;
  yearRange: YearRange;
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
        options={listYears(yearRange).map((year) => ({
          value: String(year),
          label: String(year),
        }))}
        onChange={(value) => onChange({ ...filters, ano: Number(value) })}
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
