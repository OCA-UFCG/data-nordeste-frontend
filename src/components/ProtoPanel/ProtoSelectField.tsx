"use client";

import { type ReactNode, useId } from "react";
import { ProtoIcon } from "@/components/ProtoPanel/ProtoIcon";
import type { ComboboxLook } from "@/components/Panel/filters/MultiSelectCombobox";
import { FOCUS_RING } from "@/components/ProtoPanel/protoStyles";
import { cn } from "@/lib/utils";

// `select.sel`: 204 px no desktop, largura toda e 44 px na folha do celular.
const SELECT_CLASS = `h-10 w-full cursor-pointer appearance-none truncate rounded-[6px] border border-grey-300 bg-white pr-9 pl-3 text-sm text-grey-1100 hover:border-[#9a9598] ${FOCUS_RING}`;

// Mesmo campo para o botão que abre a multisseleção (Estado e Município).
const TRIGGER_CLASS = `flex h-10 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-[6px] border border-grey-300 bg-white px-3 text-left text-sm text-grey-1100 hover:border-[#9a9598] ${FOCUS_RING}`;

/**
 * Classe do `<select>` nativo do protótipo; na folha do celular, 44 px e 15 px.
 *
 * @example <select className={protoSelectClass(false)} />
 */
export const protoSelectClass = (wide?: boolean): string =>
  cn(SELECT_CLASS, wide && "h-11 text-[15px]");

/**
 * Rótulos, larguras e botão dos campos do protótipo para um filtro que não é
 * `<select>` nativo (a multisseleção de Estado e Município).
 *
 * @example <MultiSelectCombobox look={protoFieldLook(false)} />
 */
export const protoFieldLook = (wide?: boolean): ComboboxLook =>
  wide
    ? {
        fieldClassName: "flex w-full min-w-0 flex-col gap-1 mb-3.5",
        labelClassName: "text-sm font-semibold text-grey-1100",
        triggerClassName: cn(TRIGGER_CLASS, "h-11 text-[15px]"),
      }
    : {
        fieldClassName: "flex w-[204px] min-w-0 flex-col gap-1",
        labelClassName: "text-xs font-semibold text-grey-1100",
        triggerClassName: TRIGGER_CLASS,
      };

/**
 * Campo de filtro do protótipo: rótulo em negrito acima e o controle com a
 * seta à direita. `children` recebe o `id` que liga o rótulo ao controle.
 *
 * @example <ProtoSelectField label="Ano">{(id) => <select id={id} className={protoSelectClass()} />}</ProtoSelectField>
 */
export const ProtoSelectField = ({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: (id: string) => ReactNode;
}) => {
  const id = useId();

  return (
    <div
      className={`flex flex-col gap-1 font-semibold ${wide ? "mb-3.5 text-sm" : "text-xs"}`}
    >
      <label htmlFor={id} className="leading-4">
        {label}
      </label>
      <div className={`relative ${wide ? "w-full" : "w-[204px]"}`}>
        {children(id)}
        <ProtoIcon
          name="chevronDown"
          size={16}
          stroke={2.5}
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-grey-800"
        />
      </div>
    </div>
  );
};
