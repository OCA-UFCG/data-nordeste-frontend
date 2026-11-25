"use client";

import type { FeatureCollection } from "geojson";
import { useEffect, useMemo, useState } from "react";

import {
  fetchGeodataJson,
  type GeodataFetch,
  globalFetch,
  useStableGeodataFetch,
} from "@/components/PanelMap/useGeodata";
import {
  areaStatesFileFor,
  areaStatesOutsideFileFor,
} from "@/features/panelMap/geodataFiles";
import type { AreaStates } from "@/features/panelMap/mapLayers";
import type { TerritorialArea } from "@/features/panels/territorialFilters";

/**
 * Estados partidos pela área atual. `ready`: os arquivos da área chegaram (ou
 * falharam e valem os do fallback) — o enquadramento de estado espera por ele.
 */
export type AreaStatesState = AreaStates & { ready: boolean };

// Os arquivos carregados e a área deles: os de outra área nunca são devolvidos.
type LoadedAreaStates = {
  area: TerritorialArea;
  states: AreaStates | null;
};

const NO_OUTSIDE: FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

// IMPORTANT: só uma FeatureCollection chega ao mapa. Um corpo sem `features`
// (resposta de erro, arquivo pela metade) quebrava o enquadramento com
// "collection.features is undefined"; aqui vira falha e cai no fallback.
async function fetchFeatureCollection(
  fetchGeodata: GeodataFetch,
  path: string,
): Promise<FeatureCollection> {
  const body = await fetchGeodataJson<Partial<FeatureCollection>>(
    fetchGeodata,
    path,
  );

  if (body?.type === "FeatureCollection" && Array.isArray(body.features)) {
    return body as FeatureCollection;
  }
  throw new Error(
    `Geodata file "${path}" is ${JSON.stringify(body).slice(0, 80)}; expected a GeoJSON FeatureCollection.`,
  );
}

async function loadAreaStates(
  area: TerritorialArea,
  fetchGeodata: GeodataFetch,
): Promise<AreaStates> {
  const [inside, outside] = await Promise.all([
    fetchFeatureCollection(fetchGeodata, areaStatesFileFor(area)),
    fetchFeatureCollection(fetchGeodata, areaStatesOutsideFileFor(area)),
  ]);

  return { inside, outside };
}

function areaStatesFailure(area: TerritorialArea, error: unknown): null {
  const message = error instanceof Error ? error.message : String(error);

  console.error(
    JSON.stringify({ event: "panel_map_area_states_failed", area, message }),
  );

  return null;
}

// Sem os arquivos da área (404, corpo inválido): o estado inteiro (hover e
// seleção não somem) e um véu de "parte de fora" vazio — nunca undefined.
function fallbackStates(
  loaded: LoadedAreaStates | null,
  area: TerritorialArea,
  fallback: FeatureCollection,
): AreaStatesState {
  const current = loaded?.area === area ? loaded : null;
  const states = current?.states ?? { inside: fallback, outside: NO_OUTSIDE };

  return { ...states, ready: current !== null };
}

/**
 * Estados partidos pela área de interesse: `estados_<area>.geojson` (dentro)
 * e `estados_fora_<area>.geojson` (fora). Enquanto carregam, ou se falharem,
 * `inside` é o `fallback` (o `estados.geojson` inteiro) e `outside` fica vazio.
 * Trocar a área busca os arquivos dela.
 *
 * @example const areaStates = useAreaStates("sudene", geodata.states);
 */
export function useAreaStates(
  area: TerritorialArea,
  fallback: FeatureCollection,
  fetchGeodata: GeodataFetch = globalFetch,
): AreaStatesState {
  const [loaded, setLoaded] = useState<LoadedAreaStates | null>(null);
  const stableFetch = useStableGeodataFetch(fetchGeodata);

  useEffect(() => {
    let cancelled = false;

    loadAreaStates(area, stableFetch)
      .catch((error: unknown) => areaStatesFailure(area, error))
      .then((states) => (cancelled ? undefined : setLoaded({ area, states })));

    return () => void (cancelled = true);
  }, [area, stableFetch]);

  return useMemo(
    () => fallbackStates(loaded, area, fallback),
    [loaded, area, fallback],
  );
}
