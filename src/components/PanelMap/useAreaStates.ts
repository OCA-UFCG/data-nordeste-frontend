"use client";

import type { FeatureCollection } from "geojson";
import { useEffect, useState } from "react";

import {
  fetchGeodataJson,
  type GeodataFetch,
  globalFetch,
} from "@/components/PanelMap/useGeodata";
import { areaStatesFileFor } from "@/features/panelMap/geodataFiles";
import type { TerritorialArea } from "@/features/panels/territorialFilters";

// O arquivo carregado e a área dele: o de outra área nunca é devolvido.
type LoadedAreaStates = {
  area: TerritorialArea;
  states: FeatureCollection | null;
};

function areaStatesFailure(area: TerritorialArea, error: unknown): null {
  const message = error instanceof Error ? error.message : String(error);

  console.error(
    JSON.stringify({ event: "panel_map_area_states_failed", area, message }),
  );

  return null;
}

/**
 * Estados recortados pela área de interesse (`estados_<area>.geojson`), ou
 * `fallback` (o `estados.geojson` inteiro) enquanto o arquivo da área atual
 * carrega ou se ele falhar — o hover e a seleção voltam ao estado inteiro em
 * vez de sumirem. Trocar a área busca o arquivo dela.
 *
 * @example const areaStates = useAreaStates("sudene", geodata.states);
 */
export function useAreaStates(
  area: TerritorialArea,
  fallback: FeatureCollection,
  fetchGeodata: GeodataFetch = globalFetch,
): FeatureCollection {
  const [loaded, setLoaded] = useState<LoadedAreaStates | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchGeodataJson<FeatureCollection>(fetchGeodata, areaStatesFileFor(area))
      .catch((error: unknown) => areaStatesFailure(area, error))
      .then((states) => (cancelled ? undefined : setLoaded({ area, states })));

    return () => void (cancelled = true);
  }, [area, fetchGeodata]);

  return (loaded?.area === area && loaded.states) || fallback;
}
