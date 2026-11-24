"use client";

import type { FeatureCollection } from "geojson";
import { useEffect, useState } from "react";

import { featureFileFor } from "@/features/panelMap/geodataFiles";
import type {
  GeodataManifest,
  GeodataStyles,
  PanelIndicator,
} from "@/features/panelMap/geodataTypes";

export const GEODATA_BASE_URL = "/api/geodata";

export type ReadyGeodata = {
  status: "ready";
  styles: GeodataStyles;
  manifest: GeodataManifest;
  features: FeatureCollection;
  states: FeatureCollection;
  areas: FeatureCollection;
};

export type GeodataState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | ReadyGeodata;

type GeodataFetch = (url: string) => Promise<Response>;

async function fetchGeodataJson<Body>(
  fetchGeodata: GeodataFetch,
  path: string,
): Promise<Body> {
  const url = `${GEODATA_BASE_URL}/${path}`;
  const response = await fetchGeodata(url);

  if (!response.ok) {
    throw new Error(
      `Geodata request "${url}" failed with status ${response.status}; expected a JSON file from GEODATA_DIR.`,
    );
  }

  return (await response.json()) as Body;
}

/** Busca os cinco arquivos de que o mapa de um indicador precisa, em paralelo. */
export async function loadGeodata(
  indicator: PanelIndicator,
  fetchGeodata: GeodataFetch,
): Promise<ReadyGeodata> {
  const [styles, manifest, features, states, areas] = await Promise.all([
    fetchGeodataJson<GeodataStyles>(fetchGeodata, "styles.json"),
    fetchGeodataJson<GeodataManifest>(fetchGeodata, "manifest.json"),
    fetchGeodataJson<FeatureCollection>(
      fetchGeodata,
      featureFileFor(indicator),
    ),
    fetchGeodataJson<FeatureCollection>(fetchGeodata, "vector/estados.geojson"),
    fetchGeodataJson<FeatureCollection>(fetchGeodata, "vector/areas.geojson"),
  ]);

  return { status: "ready", styles, manifest, features, states, areas };
}

function geodataFailure(indicator: PanelIndicator, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  console.error(
    JSON.stringify({ event: "panel_map_geodata_failed", indicator, message }),
  );

  return { status: "error", message } as const;
}

// WHY o fetch global é lido na chamada e chamado como função solta: um
// `deps.fetch(url)` perde o `this` e o navegador lança "Illegal invocation"; e
// ler na chamada deixa o teste trocar o fetch com `vi.stubGlobal`.
const globalFetch: GeodataFetch = (url) => fetch(url);

/**
 * Geodados do mapa de um indicador (estilos, manifest e GeoJSONs). Qualquer
 * resposta que não seja ok, ou JSON inválido, vira `status: "error"`.
 *
 * @example const geodata = useGeodata("pib"); if (geodata.status === "ready") …
 */
export function useGeodata(
  indicator: PanelIndicator,
  fetchGeodata: GeodataFetch = globalFetch,
): GeodataState {
  const [state, setState] = useState<GeodataState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    setState({ status: "loading" });
    loadGeodata(indicator, fetchGeodata)
      .catch((error: unknown) => geodataFailure(indicator, error))
      .then((next) => (cancelled ? undefined : setState(next)));

    return () => void (cancelled = true);
  }, [indicator, fetchGeodata]);

  return state;
}
