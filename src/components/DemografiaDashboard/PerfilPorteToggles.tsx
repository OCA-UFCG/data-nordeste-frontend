"use client";

import type { PorteGrupo } from "@/features/panels/demografia/demografiaAnalise";
import { formatNumber } from "@/features/panels/format";
import { previewOnMouse } from "@/components/Panel/charts/RankedBars";

type PreviewHandler = (porte: string | null) => void;

/**
 * Legenda por porte (`.mleg.porte` do protótipo): cada pílula destaca os
 * municípios do porte no mapa ao ser escolhida. Clicar de novo desfaz.
 *
 * @example <PerfilPorteToggles grupos={porte.grupos} porte={porte.porte} onSelect={porte.setPorte} onPreview={porte.setPortePreview} />
 */
export const PerfilPorteToggles = ({
  grupos,
  porte,
  onSelect,
  onPreview,
}: {
  grupos: PorteGrupo[];
  porte: string | null;
  onSelect: PreviewHandler;
  onPreview: PreviewHandler;
}) => (
  <div
    className="mt-3 flex flex-wrap gap-2"
    onPointerLeave={previewOnMouse(onPreview, null)}
  >
    {grupos.map(({ porte: item, codes }) => (
      <button
        key={item.label}
        type="button"
        title={item.texto}
        aria-pressed={porte === item.label}
        onClick={() => onSelect(porte === item.label ? null : item.label)}
        onPointerEnter={previewOnMouse(onPreview, item.label)}
        onFocus={() => onPreview(item.label)}
        onBlur={() => onPreview(null)}
        className="inline-flex items-center gap-1.5 rounded-[6px] border border-grey-300 bg-white px-2.5 py-1 text-[11.5px] font-medium aria-pressed:border-(--proto-accent) aria-pressed:bg-(--proto-accent-soft) focus-visible:outline-2 focus-visible:outline-(--proto-accent)"
      >
        <i
          aria-hidden="true"
          className="inline-block size-3 rounded-full"
          style={{ background: item.color }}
        />
        {item.label} ({formatNumber(codes.length)})
      </button>
    ))}
  </div>
);
