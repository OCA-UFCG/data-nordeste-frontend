"use client";

import { FilterX } from "lucide-react";
import { useId } from "react";
import {
  TERRITORIAL_AREAS,
  type TerritorialArea,
  type TerritorialFilters,
} from "@/features/panels/territorialFilters";
import type {
  MunicipalityOption,
  UfOption,
} from "@/features/panels/territorialOptions";

type SelectOption = { value: string; label: string };

const FilterSelect = ({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) => (
  <div className="flex min-w-0 flex-col gap-1">
    <label htmlFor={id} className="text-sm font-semibold text-grey-1100">
      {label}
    </label>
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full min-w-0 truncate rounded-md border border-grey-300 bg-white px-3 text-base text-grey-1100 focus:outline-2 focus:outline-green-800"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const ALL = { value: "", label: "Todos" };

export type TerritorialFilterBarProps = {
  filters: TerritorialFilters;
  defaults: TerritorialFilters;
  years: number[];
  ufs: UfOption[];
  municipios: MunicipalityOption[];
  onChange: (next: TerritorialFilters) => void;
};

export const TerritorialFilterBar = ({
  filters,
  defaults,
  years,
  ufs,
  municipios,
  onChange,
}: TerritorialFilterBarProps) => {
  const id = useId();
  const { ano, area } = filters;

  return (
    <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-[repeat(4,minmax(0,1fr))_auto] md:items-end">
      <FilterSelect
        id={`${id}-ano`}
        label="Ano"
        value={String(ano)}
        options={years.map((year) => ({
          value: String(year),
          label: String(year),
        }))}
        onChange={(value) => onChange({ ...filters, ano: Number(value) })}
      />
      <FilterSelect
        id={`${id}-area`}
        label="Área de interesse"
        value={area}
        options={[...TERRITORIAL_AREAS]}
        onChange={(value) => onChange({ ano, area: value as TerritorialArea })}
      />
      <FilterSelect
        id={`${id}-uf`}
        label="Estado"
        value={filters.uf ?? ""}
        options={[
          ALL,
          ...ufs.map((uf) => ({ value: uf.sigla, label: uf.nome })),
        ]}
        onChange={(value) => onChange({ ano, area, uf: value || undefined })}
      />
      <FilterSelect
        id={`${id}-mun`}
        label="Município"
        value={filters.mun ?? ""}
        options={[
          ALL,
          ...municipios.map((mun) => ({ value: mun.cdMun, label: mun.nome })),
        ]}
        onChange={(value) => onChange({ ...filters, mun: value || undefined })}
      />
      <button
        type="button"
        onClick={() => onChange(defaults)}
        className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-md border border-grey-300 bg-white px-4 text-base font-medium text-green-900 transition hover:bg-green-neutro md:col-span-1"
      >
        Limpar filtros
        <FilterX aria-hidden size={18} />
      </button>
    </div>
  );
};
