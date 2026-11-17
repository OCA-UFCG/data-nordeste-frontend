"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type TooltipAt = { x: number; y: number };

export type TooltipRow = { color: string; label: string; value: string };

// 14 px ao lado do ponteiro; vira para o outro lado perto da borda da tela.
const placeTooltip = (
  at: TooltipAt,
  size: { width: number; height: number },
) => {
  const left =
    at.x + 14 + size.width > window.innerWidth - 8
      ? at.x - size.width - 14
      : at.x + 14;
  const top =
    at.y + 14 + size.height > window.innerHeight - 8
      ? at.y - size.height - 14
      : at.y + 14;

  return { left: Math.max(8, left), top: Math.max(8, top) };
};

/**
 * Dica escura que segue o ponteiro nos gráficos (`.tip` do protótipo). Vai
 * para o `body`, para nenhum card cortá-la.
 *
 * @example <IdhTooltip at={{ x: 120, y: 80 }} title="2021" rows={[{ color: "#6d34cd", label: "IDH", value: "0,702" }]} />
 */
export const IdhTooltip = ({
  at,
  title,
  rows,
}: {
  at: TooltipAt;
  title: string;
  rows: TooltipRow[];
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: at.x + 14, top: at.y + 14 });

  useLayoutEffect(() => {
    const element = ref.current;

    if (!element) return;
    setPosition(
      placeTooltip(at, {
        width: element.offsetWidth,
        height: element.offsetHeight,
      }),
    );
  }, [at]);

  return createPortal(
    <div
      ref={ref}
      role="tooltip"
      style={position}
      className="pointer-events-none fixed z-[120] max-w-[240px] rounded-[8px] bg-[#1b1a1c] px-2.5 py-2 text-[12.5px] leading-[1.4] text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)]"
    >
      <b className="mb-0.5 block text-[13px]">{title}</b>
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between gap-1.5"
        >
          <span>
            <i
              className="mr-0.5 inline-block size-2 rounded-full"
              style={{ background: row.color }}
            />{" "}
            {row.label}
          </span>
          <span>{row.value}</span>
        </div>
      ))}
    </div>,
    document.body,
  );
};
