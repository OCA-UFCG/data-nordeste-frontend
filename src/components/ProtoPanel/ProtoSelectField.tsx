"use client";

import { type ReactNode, useId } from "react";
import { ProtoIcon } from "@/components/ProtoPanel/ProtoIcon";
import type { ComboboxLook } from "@/components/Panel/filters/MultiSelectCombobox";
import { FOCUS_RING } from "@/components/ProtoPanel/protoStyles";
import { cn } from "@/lib/utils";

// `select.sel`: 204 px no desktop, largura toda e 44 px na folha do celular.
// `min-w-0` deixa o select encolher dentro do campo flexível (`fluid`).
const SELECT_CLASS = `h-10 w-full min-w-0 cursor-pointer appearance-none truncate rounded-[6px] border border-grey-300 bg-white pr-9 pl-3 text-sm text-grey-1100 hover:border-[#9a9598] ${FOCUS_RING}`;

// Mesmo campo para o botão que abre a multisseleção (Estado e Município).
const TRIGGER_CLASS = `flex h-10 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-[6px] border border-grey-300 bg-white px-3 text-left text-sm text-grey-1100 hover:border-[#9a9598] ${FOCUS_RING}`;

/**
 * Classe do `<select>` nativo do protótipo; na folha do celular, 44 px e 15 px.
 *
 * @example <select className={protoSelectClass(false)} />
 */
export const protoSelectClass = (wide?: boolean, fill?: boolean): string =>
  cn(
    SELECT_CLASS,
    wide && "h-11 text-[15px]",
    fill && !wide && "max-[901px]:pr-7 max-[901px]:pl-2.5",
  );

// `.fb-in .fl` do perfil demográfico: campos dividem a barra, entre 110 e 240 px.
// Só o desktop usa; a folha do celular segue com largura toda.
export const PROTO_FLUID_FIELD = "flex-[1_1_0] min-w-[110px] max-w-[240px]";

// `fill` (PIB): os campos dividem a linha toda, sem limite de largura.
const PROTO_FILL_FIELD = "flex-[1_1_0] min-w-0";

/**
 * Rótulos, larguras e botão dos campos do protótipo para um filtro que não é
 * `<select>` nativo (a multisseleção de Estado e Município). `fluid` (só
 * desktop) troca os 204 px fixos pela largura flexível do perfil; `fill`
 * (PIB) a troca por campos que preenchem a linha e deixa o valor em negrito,
 * como nos selects nativos.
 *
 * @example <MultiSelectCombobox look={protoFieldLook(false, true, true)} />
 */
export const protoFieldLook = (
  wide?: boolean,
  fluid?: boolean,
  fill?: boolean,
): ComboboxLook => {
  const trigger = cn(TRIGGER_CLASS, fill && "font-semibold");

  if (wide) {
    return {
      fieldClassName: "flex w-full min-w-0 flex-col gap-1 mb-3.5",
      labelClassName: cn(
        "text-sm font-semibold text-grey-1100",
        fill && "leading-4",
      ),
      triggerClassName: cn(trigger, "h-11 text-[15px]"),
    };
  }

  return {
    fieldClassName: fluid
      ? cn("flex flex-col gap-1", fill ? PROTO_FILL_FIELD : PROTO_FLUID_FIELD)
      : "flex w-[204px] min-w-0 flex-col gap-1",
    labelClassName: "text-xs font-semibold text-grey-1100",
    triggerClassName: cn(
      trigger,
      fill && "max-[901px]:pr-2 max-[901px]:pl-2.5",
    ),
  };
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
  fluid,
  fill,
  className,
  children,
}: {
  label: string;
  wide?: boolean;

  // `fluid` (só desktop): largura flexível do perfil; `className` ajusta, p. ex., o limite do Ano.
  fluid?: boolean;

  // Com `fluid` (PIB): o campo preenche a linha, sem largura máxima.
  fill?: boolean;
  className?: string;
  children: (id: string) => ReactNode;
}) => {
  const id = useId();

  return (
    <div
      className={cn(
        "flex flex-col gap-1 font-semibold",
        wide ? "mb-3.5 text-sm" : "text-xs",
        fluid && (fill ? PROTO_FILL_FIELD : PROTO_FLUID_FIELD),
        className,
      )}
    >
      <label htmlFor={id} className="leading-4">
        {label}
      </label>
      <div
        className={cn(
          "relative",
          wide && "w-full",
          fluid ? "w-full min-w-0" : !wide && "w-[204px]",
        )}
      >
        {children(id)}
        <ProtoIcon
          name="chevronDown"
          size={16}
          stroke={2.5}
          className={cn(
            "pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-grey-800",
            fill && !wide && "max-[901px]:right-2",
          )}
        />
      </div>
    </div>
  );
};
