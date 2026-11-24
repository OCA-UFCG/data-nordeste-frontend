"use client";

import { useEffect } from "react";

import { GEODATA_BASE_URL } from "@/components/PanelMap/useGeodata";
import {
  aridezRasterFile,
  aridezRasterYear,
  type PanelMapAridez,
} from "@/features/panelMap/aridezRaster";
import type { GeodataManifest } from "@/features/panelMap/geodataTypes";
import type { TerritorialArea } from "@/features/panels/territorialFilters";
import type { AridezOverlay, PanelMapEngine } from "@/lib/panelMapEngine";

/**
 * Raster da década recortado pela área.
 * Ex.: `aridezOverlay(manifest, 2020, "semiarido").url` → `"/api/geodata/raster/aridez_2020_semiarido.png"`.
 */
export function aridezOverlay(
  manifest: GeodataManifest,
  year: number,
  area: TerritorialArea,
): AridezOverlay {
  return {
    url: `${GEODATA_BASE_URL}/${aridezRasterFile(year, area)}`,
    bounds: manifest.aridez.bounds,
  };
}

/**
 * Espelha no motor o raster da aridez do modo, do ano e da área. Ano anterior
 * à 1ª década do manifest fica sem raster; trocar a área troca a imagem.
 *
 * @example usePanelMapAridez(engine, manifest, "base", 2021, "semiarido") // raster de 2020 no Semiárido
 */
export function usePanelMapAridez(
  engine: PanelMapEngine | null,
  manifest: GeodataManifest,
  aridez: PanelMapAridez,
  ano: number,
  area: TerritorialArea,
): void {
  const year =
    aridez === "base" ? aridezRasterYear(manifest.aridez.years, ano) : null;

  useEffect(() => {
    engine?.setAridez(
      year === null ? null : aridezOverlay(manifest, year, area),
    );
  }, [engine, manifest, year, area]);
}
