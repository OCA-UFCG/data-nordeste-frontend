"use client";

import { useEffect, useState } from "react";

import type { AridezChoice } from "@/components/PanelMap/AridezControl";
import { GEODATA_BASE_URL } from "@/components/PanelMap/useGeodata";
import { DEFAULT_BASEMAP } from "@/components/PanelMap/usePanelMapEngine";
import type { GeodataManifest } from "@/features/panelMap/geodataTypes";
import type {
  AridezOverlay,
  BasemapKind,
  PanelMapEngine,
} from "@/lib/panelMapEngine";

/** Raster da década. Ex.: `aridezOverlay(manifest, 2020).url` → `"/api/geodata/raster/aridez_2020.png"`. */
export function aridezOverlay(
  manifest: GeodataManifest,
  year: number,
): AridezOverlay {
  return {
    url: `${GEODATA_BASE_URL}/raster/aridez_${year}.png`,
    bounds: manifest.aridez.bounds,
  };
}

/**
 * Estado dos controles sobre o mapa (basemap e aridez) e o espelho dele no
 * motor. Começa no Oceano, com a aridez desligada na década mais recente.
 * `onBasemapChange` avisa o card da troca (o crédito da imagem baixada segue
 * o basemap).
 *
 * @example const controls = usePanelMapControls(engine, manifest); <BasemapSwitch value={controls.basemap} onChange={controls.setBasemap} />
 */
export function usePanelMapControls(
  engine: PanelMapEngine | null,
  manifest: GeodataManifest,
  onBasemapChange?: (kind: BasemapKind) => void,
) {
  const [basemap, setBasemapState] = useState<BasemapKind>(DEFAULT_BASEMAP);
  const setBasemap = (kind: BasemapKind) => {
    setBasemapState(kind);
    onBasemapChange?.(kind);
  };
  const [aridez, setAridez] = useState<AridezChoice>({
    on: false,
    year: Math.max(...manifest.aridez.years),
  });

  useEffect(() => engine?.setBasemap(basemap), [engine, basemap]);
  useEffect(() => {
    engine?.setAridez(aridez.on ? aridezOverlay(manifest, aridez.year) : null);
  }, [engine, manifest, aridez]);

  return { basemap, setBasemap, aridez, setAridez };
}
