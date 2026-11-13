"use client";

import { type Ref, useId } from "react";
import { PlaceFilter } from "@/components/Panel/filters/TerritorialFilterBar";
import { ProtoFilterBar } from "@/components/ProtoPanel/ProtoFilterBar";
import {
  ProtoSelectField,
  protoFieldLook,
  protoSelectClass,
} from "@/components/ProtoPanel/ProtoSelectField";
import {
  TERRITORIAL_AREAS,
  type TerritorialArea,
  type TerritorialFilters,
} from "@/features/panels/territorialFilters";
import {
  describeTerritorialSelection,
  type TerritorialSelection,
} from "@/features/panels/territorialOptions";

// `years`: os anos do painel, do mais recente ao mais antigo (`listYears`).
// `maxPlaces`: quantos municípios o painel aceita no filtro.
type FieldsProps = {
  data: TerritorialSelection;
  years: readonly number[];
  maxPlaces: number;
  onChange: (filters: TerritorialFilters) => void;
};

// Ano e Área são selects nativos; Estado e Município, multisseleção com busca.
const TerritorialFilterFields = ({
  data,
  years,
  maxPlaces,
  onChange,
  wide,
}: FieldsProps & { wide: boolean }) => {
  const { filters } = data;
  const id = useId();

  // Desktop: campos flexíveis como `.fb-in .fl` do protótipo; a folha do celular fica com largura toda.
  const fluid = !wide;

  return (
    <>
      <ProtoSelectField
        label="Ano"
        wide={wide}
        fluid={fluid}
        className={fluid ? "max-w-[140px]" : undefined}
      >
        {(fieldId) => (
          <select
            id={fieldId}
            value={filters.ano}
            onChange={(event) =>
              onChange({ ...filters, ano: Number(event.target.value) })
            }
            className={protoSelectClass(wide)}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        )}
      </ProtoSelectField>
      <ProtoSelectField label="Área de interesse" wide={wide} fluid={fluid}>
        {(fieldId) => (
          <select
            id={fieldId}
            value={filters.area}
            onChange={(event) =>
              onChange({
                ...filters,
                area: event.target.value as TerritorialArea,
              })
            }
            className={protoSelectClass(wide)}
          >
            {TERRITORIAL_AREAS.map((area) => (
              <option key={area.value} value={area.value}>
                {area.label}
              </option>
            ))}
          </select>
        )}
      </ProtoSelectField>
      <PlaceFilter
        id={`${id}-uf`}
        label="Estado"
        plural="estados"
        multiple
        values={filters.uf}
        options={data.ufs.map((uf) => ({ value: uf.sigla, label: uf.nome }))}
        onChange={(uf) => onChange({ ...filters, uf })}
        look={protoFieldLook(wide, fluid)}
      />
      <PlaceFilter
        id={`${id}-mun`}
        label="Município"
        plural="municípios"
        multiple
        max={maxPlaces}
        values={filters.mun}
        options={data.municipios.map((mun) => ({
          value: mun.cdMun,
          label: mun.nome,
        }))}
        onChange={(mun) => onChange({ ...filters, mun })}
        look={protoFieldLook(wide, fluid)}
      />
    </>
  );
};

/**
 * Barra de filtros territoriais dos painéis do protótipo (perfil demográfico
 * e PIB): Ano, Área, Estado e Município, com o resumo e a folha no celular
 * (`ProtoFilterBar`).
 *
 * @example <ProtoTerritorialFilters data={panel} years={listYears(PIB_YEAR_RANGE)} maxPlaces={100} onChange={apply} onClear={reset} isDefault top={80} stuck={false} barRef={ref} />
 */
export const ProtoTerritorialFilters = ({
  data,
  years,
  maxPlaces,
  onChange,
  onClear,
  isDefault,
  top,
  stuck,
  barRef,
}: FieldsProps & {
  onClear: () => void;
  isDefault: boolean;
  top: number;
  stuck: boolean;
  barRef: Ref<HTMLDivElement>;
}) => (
  <ProtoFilterBar
    summaryTitle={describeTerritorialSelection(data, true)}
    renderFields={(wide) => (
      <TerritorialFilterFields
        data={data}
        years={years}
        maxPlaces={maxPlaces}
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
