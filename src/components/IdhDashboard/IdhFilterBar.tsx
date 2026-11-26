"use client";

import { type Ref, useId } from "react";
import {
  type ComboboxLook,
  MultiSelectCombobox,
} from "@/components/Panel/filters/MultiSelectCombobox";
import {
  ProtoFilterBar,
  type ProtoFilterBarBrand,
} from "@/components/ProtoPanel/ProtoFilterBar";
import { protoFieldLook } from "@/components/ProtoPanel/ProtoSelectField";
import { cn } from "@/lib/utils";
import { listYears, withYear } from "@/features/panels/territorialFilters";
import {
  IDH_DEFAULT_UF,
  idhPlaceName,
  type IdhFilters,
  type IdhPanelData,
} from "@/features/panels/idh/idhPanel";

const BRAND: ProtoFilterBarBrand = { icon: "idh", title: "IDH" };

// `.fb .fb-in>.fl`: Estado e Ano dividem a barra; até 900 px o botão aperta a
// folga da seta.
const BAR_FIELD_CLASS = "max-w-none min-w-0 max-[900px]:[&>div>svg]:right-2";
const BAR_TRIGGER_CLASS = "max-[900px]:px-2.5";

// Sem a opção "Todos": o IDH não se tira pela média dos estados (ver
// `IDH_DEFAULT_UF`).
// `selection`: os filtros pedidos, que os campos mostram já antes de o
// servidor responder (e de onde parte o próximo filtro).
type FilterProps = {
  data: IdhPanelData;
  selection: IdhFilters;
  onChange: (filters: IdhFilters) => void;
};

// Estado e Ano no padrão de escolha única com busca dos outros painéis
// (eram selects nativos até 26/11/2026). Os dois são obrigatórios: sem
// "Limpar seleção" e sem desmarcar.
const fieldLook = (wide?: boolean): ComboboxLook => {
  const look = protoFieldLook(wide, !wide);

  return wide
    ? look
    : {
        ...look,
        fieldClassName: cn(look.fieldClassName, BAR_FIELD_CLASS),
        triggerClassName: cn(look.triggerClassName, BAR_TRIGGER_CLASS),
      };
};

const FilterFields = ({
  data,
  selection,
  onChange,
  wide,
}: FilterProps & { wide?: boolean }) => {
  const id = useId();
  const ufs = [...data.ufs].sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
  const years = [...listYears(data.yearRange)].reverse();
  const look = fieldLook(wide);

  return (
    <>
      <MultiSelectCombobox
        id={`${id}-uf`}
        label="Estado"
        plural="estados"
        single
        required
        values={[selection.uf ?? IDH_DEFAULT_UF]}
        options={ufs.map((uf) => ({ value: uf.sigla, label: uf.nome }))}
        onChange={([uf]) => onChange({ ...selection, uf })}
        {...look}
      />
      <MultiSelectCombobox
        id={`${id}-ano`}
        label="Ano"
        plural="anos"
        single
        required
        values={[String(selection.ano)]}
        options={years.map((year) => ({
          value: String(year),
          label: String(year),
        }))}
        onChange={([ano]) => onChange({ ...selection, ano: Number(ano) })}
        {...look}
      />
    </>
  );
};

/**
 * Barra de filtros do painel de IDH: o nome do painel, Estado e Ano; o resto
 * (resumo no celular, folha, "Limpar filtros" e o gruda-no-topo) é a
 * `ProtoFilterBar`.
 *
 * @example <IdhFilterBar data={panel} selection={panel.filters} visaoLabel="Visão geral" onChange={apply} onClear={reset} isDefault top={80} stuck={false} barRef={ref} />
 */
export const IdhFilterBar = ({
  data,
  selection,
  onChange,
  visaoLabel,
  onClear,
  isDefault,
  top,
  stuck,
  barRef,
}: FilterProps & {
  visaoLabel: string;
  onClear: () => void;
  isDefault: boolean;
  top: number;
  stuck: boolean;
  barRef: Ref<HTMLDivElement>;
}) => (
  <ProtoFilterBar
    brand={BRAND}
    brandInBar
    summaryTitle={`${withYear(idhPlaceName({ ufs: data.ufs, filters: selection }), selection.ano)} · ${visaoLabel}`}
    renderFields={(wide) => (
      <FilterFields
        data={data}
        selection={selection}
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
