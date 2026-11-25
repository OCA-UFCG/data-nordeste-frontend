"use client";

import { type Ref, useId } from "react";
import { MultiSelectCombobox } from "@/components/Panel/filters/MultiSelectCombobox";
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
import { cn } from "@/lib/utils";

// `years`: os anos do painel, do mais recente ao mais antigo (`listYears`).
type FieldsProps = {
  data: TerritorialSelection;
  years: readonly number[];
  onChange: (filters: TerritorialFilters) => void;
};

// Com a marca na barra (`.fb .fb-in>.fl` do protótipo do perfil): os campos
// dividem a barra sem limite de largura, o Ano com 0,6 da parte dos outros, e
// até 900 px o select aperta a folga da seta.
const BRANDED_FIELD = "min-w-0 max-w-none max-[900px]:[&>div>svg]:right-2";
type FieldClasses = {
  year?: string;
  field?: string;
  select?: string;
  trigger?: string;
};

const BRANDED: FieldClasses = {
  year: cn(BRANDED_FIELD, "flex-[.6_1_0] max-[900px]:min-w-[84px]"),
  field: BRANDED_FIELD,
  select: "max-[900px]:pr-7 max-[900px]:pl-2.5",
  trigger: "max-[900px]:px-2.5",
};

// Sem a marca, o Ano fica entre 110 e 140 px (PIB e aridez); na folha do
// celular, nada muda.
const fieldClasses = (fluid: boolean, branded: boolean): FieldClasses => {
  if (fluid && branded) return BRANDED;

  return { year: fluid ? "max-w-[140px]" : undefined };
};

// Ano é select nativo; Área, Estado e Município, escolha única com busca no
// padrão do Estado. A Área é obrigatória (`required`): não desmarca nem tem
// "Limpar seleção".
const TerritorialFilterFields = ({
  data,
  years,
  onChange,
  wide,
  branded,
  fillRow,
  yearRef,
}: FieldsProps & {
  wide: boolean;
  branded: boolean;
  fillRow?: boolean;
  yearRef?: Ref<HTMLSelectElement>;
}) => {
  const { filters } = data;
  const id = useId();

  // Desktop: campos flexíveis como `.fb-in .fl` do protótipo; a folha do celular fica com largura toda.
  const fluid = !wide;
  const classes = fieldClasses(fluid, branded);
  const selectClass = cn(protoSelectClass(wide, fillRow), classes.select);
  const baseLook = protoFieldLook(wide, fluid, fillRow);
  const placeLook = {
    ...baseLook,
    fieldClassName: cn(baseLook.fieldClassName, classes.field),
    triggerClassName: cn(baseLook.triggerClassName, classes.trigger),
  };

  return (
    <>
      <ProtoSelectField
        label="Ano"
        wide={wide}
        fluid={fluid}
        fill={fillRow}
        className={
          fillRow ? "flex-[.6_1_0] max-[901px]:min-w-[84px]" : classes.year
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

      {/*
       * INTENTIONAL: trocar a área mantém Estado e Município escolhidos,
       * diferente do `TerritorialSelects` do PIB, que zera os dois. É o que faz
       * o `norm()` do protótipo, que só descarta a UF que sai da área. Quem
       * descarta a UF e o município fora da área nova é o servidor (`keepKnown`
       * em `src/features/panels/territorialOptions.ts`). Estado e Município
       * aceitam uma opção só; trocar o Estado zera o Município, que pode não
       * ser do estado novo.
       */}
      <MultiSelectCombobox
        id={`${id}-area`}
        label="Área de interesse"
        plural="áreas"
        single
        required
        values={[filters.area]}
        options={[...TERRITORIAL_AREAS]}
        onChange={([area]) =>
          onChange({ ...filters, area: area as TerritorialArea })
        }
        {...placeLook}
      />
      <PlaceFilter
        id={`${id}-uf`}
        label="Estado"
        plural="estados"
        multiple
        single
        values={filters.uf}
        options={data.ufs.map((uf) => ({ value: uf.sigla, label: uf.nome }))}
        onChange={(uf) => onChange({ ...filters, uf, mun: undefined })}
        look={placeLook}
      />
      <PlaceFilter
        id={`${id}-mun`}
        label="Município"
        plural="municípios"
        multiple
        single
        values={filters.mun}
        options={data.municipios.map((mun) => ({
          value: mun.cdMun,
          label: mun.nome,
        }))}
        onChange={(mun) => onChange({ ...filters, mun })}
        look={placeLook}
      />
    </>
  );
};

/**
 * Barra de filtros territoriais dos painéis do protótipo (perfil demográfico
 * e PIB): Ano, Área, Estado e Município, com o resumo e a folha no celular
 * (`ProtoFilterBar`).
 *
 * @example <ProtoTerritorialFilters data={panel} years={listYears(PIB_YEAR_RANGE)} onChange={apply} onClear={reset} isDefault top={80} stuck={false} barRef={ref} />
 */
export const ProtoTerritorialFilters = ({
  data,
  years,
  onChange,
  onClear,
  isDefault,
  top,
  stuck,
  barRef,
  brand,
  brandInBar = false,
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

    // Põe a `brand` no início da barra do desktop, como no perfil demográfico:
    // os quatro campos dividem o resto (sem os limites de largura do PIB) e,
    // até 900 px, fica só o ícone da marca.
    brandInBar?: boolean;

    // O select de Ano do desktop (a folha do celular tem o seu).
    yearRef?: Ref<HTMLSelectElement>;
  }) => (
  <ProtoFilterBar
    summaryTitle={describeTerritorialSelection(data, true)}
    brand={brand}
    brandInBar={brandInBar && "compact"}
    fillRow={fillRow}
    disabled={disabled}
    {...sheet}
    renderFields={(wide) => (
      <TerritorialFilterFields
        data={data}
        years={years}
        onChange={onChange}
        wide={wide}
        branded={brandInBar}
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
