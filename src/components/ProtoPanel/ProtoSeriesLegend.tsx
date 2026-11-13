"use client";

import { useState } from "react";

export type ProtoLegendSeries<Key extends string> = {
  key: Key;
  label: string;
  color: string;
};

/**
 * Séries escondidas pela legenda de um gráfico de linhas. `toggle` mostra ou
 * esconde uma série.
 *
 * @example const { hidden, toggle } = useHiddenSeries<"idh" | "idhAd">();
 */
export const useHiddenSeries = <Key extends string>() => {
  const [hidden, setHidden] = useState<Set<Key>>(new Set());
  const toggle = (key: Key) => {
    const next = new Set(hidden);

    if (!next.delete(key)) next.add(key);
    setHidden(next);
  };

  return { hidden, toggle };
};

/**
 * Legenda dos gráficos de linha (`.legend` do protótipo): cada série é um
 * botão que a mostra ou esconde. A escondida fica riscada; a última visível
 * não se esconde.
 *
 * @example <ProtoSeriesLegend series={[{ key: "idh", label: "IDH", color: "#6d34cd" }]} hidden={hidden} onToggle={toggle} />
 */
export const ProtoSeriesLegend = <Key extends string>({
  series,
  hidden,
  onToggle,
}: {
  series: readonly ProtoLegendSeries<Key>[];
  hidden: Set<Key>;
  onToggle: (key: Key) => void;
}) => (
  <div className="mb-1.5 flex flex-wrap gap-x-4 gap-y-2">
    {series.map((item) => {
      const visible = !hidden.has(item.key);

      return (
        <button
          key={item.key}
          type="button"
          aria-pressed={visible}
          disabled={visible && hidden.size === series.length - 1}
          onClick={() => onToggle(item.key)}
          className="inline-flex items-center gap-2 py-0.5 text-xs leading-4 aria-[pressed=false]:opacity-50 disabled:cursor-default [&[aria-pressed=false]_span]:line-through"
        >
          <i
            className="inline-block size-2.5 rounded-full"
            style={{ background: item.color }}
          />
          <span>{item.label}</span>
        </button>
      );
    })}
  </div>
);
