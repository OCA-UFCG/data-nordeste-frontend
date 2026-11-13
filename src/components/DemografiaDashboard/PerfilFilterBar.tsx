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
  DEMOGRAFIA_MAX_PLACES,
  DEMOGRAFIA_YEAR_RANGE,
  type DemografiaPanelData,
} from "@/features/panels/demografia/demografiaPanel";
import {
  listYears,
  TERRITORIAL_AREAS,
  type TerritorialArea,
  type TerritorialFilters,
} from "@/features/panels/territorialFilters";
import { describeTerritorialSelection } from "@/features/panels/territorialOptions";

const YEARS = listYears(DEMOGRAFIA_YEAR_RANGE);

type FieldsProps = {
  data: DemografiaPanelData;
  onChange: (filters: TerritorialFilters) => void;
};

// Ano e Área são selects nativos; Estado e Município, multisseleção com busca.
const PerfilFilterFields = ({
  data,
  onChange,
  wide,
}: FieldsProps & { wide: boolean }) => {
  const { filters } = data;
  const id = useId();

  return (
    <>
      <ProtoSelectField label="Ano" wide={wide}>
        {(fieldId) => (
          <select
            id={fieldId}
            value={filters.ano}
            onChange={(event) =>
              onChange({ ...filters, ano: Number(event.target.value) })
            }
            className={protoSelectClass(wide)}
          >
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        )}
      </ProtoSelectField>
      <ProtoSelectField label="Área de interesse" wide={wide}>
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
        look={protoFieldLook(wide)}
      />
      <PlaceFilter
        id={`${id}-mun`}
        label="Município"
        plural="municípios"
        multiple
        max={DEMOGRAFIA_MAX_PLACES}
        values={filters.mun}
        options={data.municipios.map((mun) => ({
          value: mun.cdMun,
          label: mun.nome,
        }))}
        onChange={(mun) => onChange({ ...filters, mun })}
        look={protoFieldLook(wide)}
      />
    </>
  );
};

/**
 * Barra de filtros do perfil demográfico: Ano, Área, Estado e Município, com
 * o resumo e a folha no celular (`ProtoFilterBar`).
 *
 * @example <PerfilFilterBar data={panel} onChange={apply} onClear={reset} isDefault top={80} stuck={false} barRef={ref} />
 */
export const PerfilFilterBar = ({
  data,
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
      <PerfilFilterFields data={data} onChange={onChange} wide={wide} />
    )}
    isDefault={isDefault}
    onClear={onClear}
    top={top}
    stuck={stuck}
    barRef={barRef}
  />
);
