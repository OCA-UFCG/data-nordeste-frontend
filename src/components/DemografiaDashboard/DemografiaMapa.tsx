"use client";

import { useMemo, useState } from "react";
import { previewOnMouse } from "@/components/Panel/charts/RankedBars";
import {
  municipiosPorPorte,
  type PorteGrupo,
} from "@/features/panels/demografia/demografiaAnalise";
import type { MunicipioPoint } from "@/features/panels/demografia/demografiaPanel";
import { formatNumber } from "@/features/panels/format";

// O que acende no mapa: o município sob o mouse na lista; senão, o porte sob o
// mouse (ou foco) na legenda; senão, o porte fixado com clique.
export const useDemografiaHighlight = (municipios: MunicipioPoint[]) => {
  const grupos = useMemo(() => municipiosPorPorte(municipios), [municipios]);
  const [porte, setPorte] = useState<string | null>(null);
  const [portePreview, setPortePreview] = useState<string | null>(null);
  const [munPreview, setMunPreview] = useState<string | null>(null);
  const codeByLabel = useMemo(
    () => new Map(municipios.map((item) => [item.label, item.code])),
    [municipios],
  );
  const highlightCodes = useMemo(() => {
    const code = munPreview ? codeByLabel.get(munPreview) : undefined;

    if (code) return new Set([code]);
    const shown = portePreview ?? porte;
    const grupo = grupos.find((item) => item.porte.label === shown);

    return grupo ? new Set(grupo.codes) : undefined;
  }, [munPreview, codeByLabel, portePreview, porte, grupos]);

  return {
    grupos,
    porte,
    setPorte,
    setPortePreview,
    setMunPreview,
    codeByLabel,
    highlightCodes,
  };
};

export const PorteLegend = ({
  grupos,
  porte,
  onSelect,
  onPreview,
}: {
  grupos: PorteGrupo[];
  porte: string | null;
  onSelect: (porte: string | null) => void;
  onPreview: (porte: string | null) => void;
}) => (
  <ul
    className="mt-3 flex flex-wrap gap-1.5"
    onPointerLeave={previewOnMouse(onPreview, null)}
  >
    {grupos.map(({ porte: item, codes }) => (
      <li key={item.label}>
        <button
          type="button"
          aria-pressed={porte === item.label}
          title={item.texto}
          onClick={() => onSelect(porte === item.label ? null : item.label)}
          onPointerEnter={previewOnMouse(onPreview, item.label)}
          onFocus={() => onPreview(item.label)}
          onBlur={() => onPreview(null)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-grey-200 px-2 text-sm text-grey-1000 hover:bg-pink-100 focus-visible:outline-2 focus-visible:outline-green-800 aria-pressed:border-[#c53d69] aria-pressed:bg-pink-100"
        >
          <span
            aria-hidden
            className="size-3.5 shrink-0 rounded-full border border-grey-300"
            style={{ backgroundColor: item.color }}
          />
          {item.label} ({formatNumber(codes.length)})
        </button>
      </li>
    ))}
  </ul>
);
