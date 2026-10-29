"use client";

import { useId } from "react";
import { MultiSelectCombobox } from "@/components/Panel/MultiSelectCombobox";
import {
  TERRITORIAL_AREAS,
  type TerritorialArea,
  type TerritorialFilters,
} from "@/features/panels/territorialFilters";
import type {
  MunicipalityOption,
  UfOption,
} from "@/features/panels/territorialOptions";

export type SelectOption = { value: string; label: string };

export const FilterSelect = ({
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

export const ALL_OPTION = { value: "", label: "Todos" };

type TerritorialSelectsProps = {
  filters: TerritorialFilters;
  years: number[];
  ufs: UfOption[];
  municipios: MunicipalityOption[];
  onChange: (next: TerritorialFilters) => void;

  // Estado e Município com busca e várias escolhas (PIB). Sem ele, selects nativos.
  multiple?: boolean;
};

type PlaceFilterProps = {
  id: string;
  label: string;
  plural: string;
  multiple?: boolean;
  values?: string[];
  options: SelectOption[];
  onChange: (values?: string[]) => void;
};

// Lista vazia vira undefined: "Todos" não aparece na URL nem no SQL.
const PlaceFilter = ({
  multiple,
  values,
  options,
  onChange,
  ...field
}: PlaceFilterProps) =>
  multiple ? (
    <MultiSelectCombobox
      {...field}
      values={values ?? []}
      options={options}
      onChange={(next) => onChange(next.length ? next : undefined)}
    />
  ) : (
    <FilterSelect
      id={field.id}
      label={field.label}
      value={values?.[0] ?? ""}
      options={[ALL_OPTION, ...options]}
      onChange={(value) => onChange(value ? [value] : undefined)}
    />
  );

// Só os quatro selects, para quem monta o próprio layout (ex.: PanelFilters).
export const TerritorialSelects = ({
  filters,
  years,
  ufs,
  municipios,
  onChange,
  multiple,
}: TerritorialSelectsProps) => {
  const id = useId();
  const { ano, area } = filters;

  return (
    <>
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
      {/* Select único troca a UF e zera o município; na multisseleção os municípios
          ficam e o servidor descarta os que saíram das UFs escolhidas. */}
      <PlaceFilter
        id={`${id}-uf`}
        label="Estado"
        plural="estados"
        multiple={multiple}
        values={filters.uf}
        options={ufs.map((uf) => ({ value: uf.sigla, label: uf.nome }))}
        onChange={(uf) =>
          onChange(multiple ? { ...filters, uf } : { ano, area, uf })
        }
      />
      <PlaceFilter
        id={`${id}-mun`}
        label="Município"
        plural="municípios"
        multiple={multiple}
        values={filters.mun}
        options={municipios.map((mun) => ({
          value: mun.cdMun,
          label: mun.nome,
        }))}
        onChange={(mun) => onChange({ ...filters, mun })}
      />
    </>
  );
};
