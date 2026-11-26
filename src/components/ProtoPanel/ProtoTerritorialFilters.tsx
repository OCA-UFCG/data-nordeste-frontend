"use client";

import { type Ref, useId } from "react";
import { MultiSelectCombobox } from "@/components/Panel/filters/MultiSelectCombobox";
import { PlaceFilter } from "@/components/Panel/filters/TerritorialFilterBar";
import {
  ProtoFilterBar,
  type ProtoFilterBarProps,
  type ProtoFilterSheetControl,
} from "@/components/ProtoPanel/ProtoFilterBar";
import { protoFieldLook } from "@/components/ProtoPanel/ProtoSelectField";
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
// até 900 px o botão aperta a folga da seta.
const BRANDED_FIELD = "min-w-0 max-w-none max-[900px]:[&>div>svg]:right-2";
type FieldClasses = {
  year?: string;
  field?: string;
  trigger?: string;
};

const BRANDED: FieldClasses = {
  year: cn(BRANDED_FIELD, "flex-[.6_1_0] max-[900px]:min-w-[84px]"),
  field: BRANDED_FIELD,
  trigger: "max-[900px]:px-2.5",
};

// Sem a marca, o Ano fica entre 110 e 140 px (PIB e aridez); na folha do
// celular, nada muda.
const fieldClasses = (fluid: boolean, branded: boolean): FieldClasses => {
  if (fluid && branded) return BRANDED;

  return { year: fluid ? "max-w-[140px]" : undefined };
};

// Os quatro campos são escolha única com busca, no padrão do Estado (o Ano
// era select nativo até 26/11/2026). Ano e Área são obrigatórios
// (`required`): não desmarcam nem têm "Limpar seleção".
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
  yearRef?: Ref<HTMLButtonElement>;
}) => {
  const { filters } = data;
  const id = useId();

  // Desktop: campos flexíveis como `.fb-in .fl` do protótipo; a folha do celular fica com largura toda.
  const fluid = !wide;
  const classes = fieldClasses(fluid, branded);
  const baseLook = protoFieldLook(wide, fluid, fillRow);
  const placeLook = {
    ...baseLook,
    fieldClassName: cn(baseLook.fieldClassName, classes.field),
    triggerClassName: cn(baseLook.triggerClassName, classes.trigger),
  };
  const yearLook = {
    ...placeLook,
    fieldClassName: cn(
      placeLook.fieldClassName,
      fillRow ? "flex-[.6_1_0] max-[901px]:min-w-[84px]" : classes.year,
    ),
  };

  return (
    <>
      <MultiSelectCombobox
        id={`${id}-ano`}
        label="Ano"
        plural="anos"
        single
        required
        values={[String(filters.ano)]}
        options={years.map((year) => ({
          value: String(year),
          label: String(year),
        }))}
        onChange={([ano]) => onChange({ ...filters, ano: Number(ano) })}
        triggerRef={wide ? undefined : yearRef}
        {...yearLook}
      />

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

    // O botão do Ano do desktop (a folha do celular tem o seu).
    yearRef?: Ref<HTMLButtonElement>;
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
