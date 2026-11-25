"use client";

import { useEffect, useState } from "react";

import { DEFAULT_BASEMAP } from "@/components/PanelMap/usePanelMapEngine";
import type { BasemapKind, PanelMapEngine } from "@/lib/panelMapEngine";

/**
 * Estado do controle de basemap sobre o mapa e o espelho dele no motor.
 * Começa em `initialBasemap` (lido só na montagem; sem ele, o Padrão).
 * `onBasemapChange` avisa o card da troca (o crédito da imagem baixada segue
 * o basemap).
 *
 * @example const controls = usePanelMapControls(engine); <BasemapSwitch value={controls.basemap} onChange={controls.setBasemap} />
 */
export function usePanelMapControls(
  engine: PanelMapEngine | null,
  onBasemapChange?: (kind: BasemapKind) => void,
  initialBasemap: BasemapKind = DEFAULT_BASEMAP,
) {
  const [basemap, setBasemapState] = useState<BasemapKind>(initialBasemap);
  const setBasemap = (kind: BasemapKind) => {
    setBasemapState(kind);
    onBasemapChange?.(kind);
  };

  useEffect(() => engine?.setBasemap(basemap), [engine, basemap]);

  return { basemap, setBasemap };
}
