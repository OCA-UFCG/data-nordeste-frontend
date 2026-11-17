"use client";

import { type KeyboardEvent, type MouseEvent, useState } from "react";
import type { TooltipAt } from "@/components/ProtoPanel/ProtoTooltip";
import {
  stepYear,
  yearIndexAtPointer,
} from "@/features/panels/lineInteraction";

export type LineYearHandlers = {
  onPointerMove: (event: MouseEvent<SVGRectElement>) => void;
  onPointerLeave: () => void;
  onClick: (event: MouseEvent<SVGRectElement>) => void;
  onKeyDown: (event: KeyboardEvent<SVGRectElement>) => void;
};

// O tooltip guarda o ano, não o índice: se a série muda com ele aberto
// (outro território, "Tentar de novo"), um índice antigo apontaria para fora
// da série nova ou para outro ano.
export type LineYearHover = TooltipAt & { ano: number };

/**
 * Interação dos gráficos de linha anuais (IDH, PIB): ponteiro e clique
 * escolhem o ano mais próximo, setas/Home/End andam pelos anos. `hitPad`: a
 * folga lateral da área de clique, em px, além do primeiro e do último ponto.
 *
 * @example const { selectedIndex, hover, handlers } = useLineYear({ years, ano, onSelectYear });
 */
export const useLineYear = ({
  years,
  ano,
  onSelectYear,
  hitPad = 0,
}: {
  years: readonly number[];
  ano: number;
  onSelectYear: (ano: number) => void;
  hitPad?: number;
}) => {
  const [hover, setHover] = useState<LineYearHover | null>(null);
  const yearAt = (event: MouseEvent<SVGRectElement>) => {
    const { left, width } = event.currentTarget.getBoundingClientRect();
    const index = yearIndexAtPointer(
      { clientX: event.clientX, left, width },
      years.length,
      hitPad,
    );

    return years[index];
  };
  const handlers: LineYearHandlers = {
    onPointerMove: (event) =>
      setHover({ x: event.clientX, y: event.clientY, ano: yearAt(event) }),
    onPointerLeave: () => setHover(null),
    onClick: (event) => onSelectYear(yearAt(event)),
    onKeyDown: (event) => {
      const next = stepYear(years, ano, event.key);

      if (next === null) return;
      event.preventDefault();
      onSelectYear(next);
    },
  };

  // -1 quando o ano filtrado falta na série: nenhum ponto fica destacado, em
  // vez de destacar o primeiro ano enquanto os cards mostram outro.
  return { selectedIndex: years.indexOf(ano), hover, handlers };
};

/**
 * Área do gráfico que recebe o ponteiro e o teclado: um `slider` do ano.
 * `pad` aumenta a área para os lados (`x`) e para baixo (`bottom`).
 *
 * @example <ProtoYearSlider frame={geometry} years={years} ano={2021} focusClassName="focus-visible:stroke-[#7c46e1]" {...handlers} />
 */
export const ProtoYearSlider = ({
  frame,
  years,
  ano,
  pad = { x: 0, bottom: 0 },
  focusClassName,
  ...handlers
}: LineYearHandlers & {
  frame: {
    width: number;
    height: number;
    margin: { left: number; right: number; top: number; bottom: number };
  };
  years: readonly number[];
  ano: number;
  pad?: { x: number; bottom: number };
  focusClassName: string;
}) => {
  const { margin, width, height } = frame;

  return (
    <rect
      x={margin.left - pad.x}
      y={margin.top}
      width={width - margin.left - margin.right + 2 * pad.x}
      height={height - margin.top - margin.bottom + pad.bottom}
      fill="transparent"
      tabIndex={0}
      role="slider"
      aria-label="Ano selecionado"
      aria-valuemin={years[0]}
      aria-valuemax={years[years.length - 1]}
      aria-valuenow={ano}
      className={`cursor-pointer outline-none focus-visible:stroke-2 ${focusClassName}`}
      {...handlers}
    />
  );
};
