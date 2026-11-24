"use client";

import { FOCUS_RING } from "@/components/ProtoPanel/protoStyles";
import { BASEMAPS, type BasemapKind } from "@/lib/panelMapEngine";

const BASEMAP_ORDER: BasemapKind[] = ["satelite", "oceano"];

/**
 * Botões Satélite | Oceano sobre o mapa; o ativo fica com `aria-pressed`.
 *
 * @example <BasemapSwitch value={basemap} onChange={setBasemap} />
 */
export const BasemapSwitch = ({
  value,
  onChange,
}: {
  value: BasemapKind;
  onChange: (kind: BasemapKind) => void;
}) => (
  <div
    role="group"
    aria-label="Mapa de fundo"
    className="flex overflow-hidden rounded-[6px] border border-grey-300 bg-white text-xs leading-4 shadow-sm"
  >
    {BASEMAP_ORDER.map((kind) => (
      <button
        key={kind}
        type="button"
        aria-pressed={value === kind}
        onClick={() => onChange(kind)}
        className={`px-2.5 py-1.5 font-medium text-grey-800 hover:bg-grey-100 aria-pressed:bg-grey-1100 aria-pressed:text-white ${FOCUS_RING}`}
      >
        {BASEMAPS[kind].label}
      </button>
    ))}
  </div>
);
