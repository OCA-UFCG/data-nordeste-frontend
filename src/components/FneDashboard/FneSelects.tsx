"use client";

import { useId } from "react";
import { MultiSelectFilter } from "@/components/Panel/MultiSelectFilter";
import {
  ALL_OPTION,
  FilterSelect,
} from "@/components/Panel/TerritorialFilterBar";
import {
  FNE_BIOMAS,
  FNE_SEMIARIDO,
  FNE_YEAR_RANGE,
  type FneBioma,
  type FneFilters,
  type FneSemiarido,
} from "@/features/panels/fne/fneFilters";
import { listYears } from "@/features/panels/territorialFilters";
import type {
  MunicipalityOption,
  UfOption,
} from "@/features/panels/territorialOptions";

const YEARS = listYears(FNE_YEAR_RANGE).map((year) => ({
  value: String(year),
  label: String(year),
}));

const MUNICIPALITY_NOUN = { singular: "município", plural: "municípios" };

const BIOMAS = FNE_BIOMAS.map((bioma) => ({ value: bioma, label: bioma }));

// Trocar o recorte tira o município: ele pode não pertencer ao novo recorte.
export const FneSelects = ({
  filters,
  ufs,
  municipios,
  onChange,
}: {
  filters: FneFilters;
  ufs: UfOption[];
  municipios: MunicipalityOption[];
  onChange: (next: FneFilters) => void;
}) => {
  const id = useId();
  const recorte: FneFilters = { ...filters, muns: [] };

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
        id={`${id}-semiarido`}
        label="Semiárido"
        value={filters.semiarido ?? ""}
        options={[ALL_OPTION, ...FNE_SEMIARIDO]}
        onChange={(value) =>
          onChange({
            ...recorte,
            semiarido: (value || undefined) as FneSemiarido | undefined,
          })
        }
      />
      <FilterSelect
        id={`${id}-bioma`}
        label="Bioma"
        value={filters.bioma ?? ""}
        options={[ALL_OPTION, ...BIOMAS]}
        onChange={(value) =>
          onChange({
            ...recorte,
            bioma: (value || undefined) as FneBioma | undefined,
          })
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
        onChange={(value) => onChange({ ...recorte, uf: value || undefined })}
      />
      <MultiSelectFilter
        label="Município"
        noun={MUNICIPALITY_NOUN}
        options={municipios.map((mun) => ({
          value: mun.cdMun,
          label: mun.nome,
        }))}
        values={filters.muns}
        onChange={(muns) => onChange({ ...filters, muns })}
      />
    </>
  );
};
