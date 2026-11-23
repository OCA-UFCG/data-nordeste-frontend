"use client";

import { type Ref, useId } from "react";
import { PlaceFilter } from "@/components/Panel/filters/TerritorialFilterBar";
import {
  ProtoFilterBar,
  type ProtoFilterBarProps,
  type ProtoFilterSheetControl,
} from "@/components/ProtoPanel/ProtoFilterBar";
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
  fillRow,
  yearRef,
}: FieldsProps & {
  wide: boolean;
  fillRow?: boolean;
  yearRef?: Ref<HTMLSelectElement>;
}) => {
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
        fill={fillRow}
        className={
          fillRow
            ? "flex-[.6_1_0] max-[901px]:min-w-[84px]"
            : fluid
              ? "max-w-[140px]"
              : undefined
        }
      >
        {(fieldId) => (
          <select
            ref={wide ? undefined : yearRef}
            id={fieldId}
            value={filters.ano}
            onChange={(event) =>
              onChange({ ...filters, ano: Number(event.target.value) })
            }
            className={protoSelectClass(wide, fillRow)}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        )}
      </ProtoSelectField>

      {/*
       * INTENTIONAL: trocar a área mantém Estado e Município escolhidos,
       * diferente do `TerritorialSelects` do PIB, que zera os dois. É o que faz
       * o `norm()` do protótipo, que só descarta a UF que sai da área. Quem
       * descarta UFs e municípios fora da área nova é o servidor (`keepKnown`
       * em `src/features/panels/territorialOptions.ts`), o que preserva a
       * seleção de vários estados (revisão da PR #401).
       */}
      <ProtoSelectField
        label="Área de interesse"
        wide={wide}
        fluid={fluid}
        fill={fillRow}
      >
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
            className={protoSelectClass(wide, fillRow)}
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
        look={protoFieldLook(wide, fluid, fillRow)}
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
        look={protoFieldLook(wide, fluid, fillRow)}
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
  brand,
  fillRow,
  yearRef,
  disabled,
  ...sheet
}: FieldsProps &
  Pick<ProtoFilterBarProps, "brand" | "fillRow" | "disabled"> &
  ProtoFilterSheetControl & {
    onClear: () => void;
    isDefault: boolean;
    top: number;
    stuck: boolean;
    barRef: Ref<HTMLDivElement>;

    // O select de Ano do desktop (a folha do celular tem o seu).
    yearRef?: Ref<HTMLSelectElement>;
  }) => (
  <ProtoFilterBar
    summaryTitle={describeTerritorialSelection(data, true)}
    brand={brand}
    fillRow={fillRow}
    disabled={disabled}
    {...sheet}
    renderFields={(wide) => (
      <TerritorialFilterFields
        data={data}
        years={years}
        maxPlaces={maxPlaces}
        onChange={onChange}
        wide={wide}
        fillRow={fillRow}
        yearRef={yearRef}
      />
    )}
    isDefault={isDefault}
    onClear={onClear}
    top={top}
    stuck={stuck}
    barRef={barRef}
  />
);
