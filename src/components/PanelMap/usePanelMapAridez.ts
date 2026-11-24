"use client";

import { useEffect } from "react";

import { GEODATA_BASE_URL } from "@/components/PanelMap/useGeodata";
import {
  aridezRasterYear,
  type PanelMapAridez,
} from "@/features/panelMap/aridezRaster";
import type { GeodataManifest } from "@/features/panelMap/geodataTypes";
import type { AridezOverlay, PanelMapEngine } from "@/lib/panelMapEngine";

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
 * Espelha no motor o raster da aridez do modo e do ano. Ano anterior à 1ª
 * década do manifest fica sem raster.
 *
 * @example usePanelMapAridez(engine, manifest, "base", 2021) // raster de 2020
 */
export function usePanelMapAridez(
  engine: PanelMapEngine | null,
  manifest: GeodataManifest,
  aridez: PanelMapAridez,
  ano: number,
): void {
  const year =
    aridez === "base" ? aridezRasterYear(manifest.aridez.years, ano) : null;

  useEffect(() => {
    engine?.setAridez(year === null ? null : aridezOverlay(manifest, year));
  }, [engine, manifest, year]);
}
