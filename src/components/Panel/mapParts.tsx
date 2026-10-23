"use client";

import { useEffect, useMemo, useState } from "react";
import { ChartNotice } from "@/components/Panel/ChartCard";
import type { ChoroplethBucket } from "@/features/panels/choropleth";
import {
  getMapAspectRatio,
  getMapBounds,
  getMapFraming,
  getSelectionFocusBounds,
  mapNameFor,
  selectMapFeatures,
  type MapBounds,
  type MapFeature,
} from "@/features/panels/mapFraming";
import { registerChartMapFeatures } from "@/lib/echarts";

export type MeshStatus = "loading" | "ready" | "error";

// PERF: em SVG, cada passo do arrasto mexe em ~1.800 <path>; canvas é um bitmap só.
export const MAP_RENDERER = "canvas";

// Pelo ponteiro, não pela largura: no desktop o mapa fica numa coluna estreita.
const MOUSE_MEDIA_QUERY = "(hover: hover) and (pointer: fine)";

const useMousePointer = () => {
  const [hasMouse, setHasMouse] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOUSE_MEDIA_QUERY);
    const updatePointer = () => setHasMouse(mediaQuery.matches);

    updatePointer();
    mediaQuery.addEventListener("change", updatePointer);

    return () => mediaQuery.removeEventListener("change", updatePointer);
  }, []);

  return hasMouse;
};

const useMesh = (meshUrl: string) => {
  const [status, setStatus] = useState<MeshStatus>("loading");
  const [features, setFeatures] = useState<MapFeature[]>([]);

  useEffect(() => {
    fetch(meshUrl)
      .then(
        (response) => response.json() as Promise<{ features: MapFeature[] }>,
      )
      .then((mesh) => {
        setFeatures(mesh.features);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [meshUrl]);

  return { status, features };
};

// Registra no render: o efeito do EChart (filho) roda antes de um efeito aqui.
const useRegionMap = (
  meshUrl: string,
  features: MapFeature[],
  codes: string[],
) =>
  useMemo(() => {
    const visible = selectMapFeatures(features, codes);
    const mapName = mapNameFor(meshUrl, codes);

    if (visible.length) registerChartMapFeatures(mapName, visible);

    return { mapName, visible, areaBounds: getMapBounds(visible) };
  }, [meshUrl, features, codes]);

// A lista vira texto na dependência: cada render pode trazer um array novo.
const useFraming = (
  visible: MapFeature[],
  areaBounds: MapBounds | undefined,
  aspectRatio: number,
  selectedCodes: string[],
) => {
  const selectionKey = selectedCodes.join(",");

  return useMemo(() => {
    const codes = selectionKey ? selectionKey.split(",") : [];
    const focusBounds = getSelectionFocusBounds(visible, codes);

    return areaBounds
      ? getMapFraming(areaBounds, aspectRatio, focusBounds)
      : undefined;
  }, [visible, selectionKey, areaBounds, aspectRatio]);
};

/**
 * Loads the mesh, registers the visible regions and frames the map on them,
 * zooming into the selected municipalities that are in the mesh.
 * @example const frame = useMapFrame("/maps/municipios-sudene.json", codes, filters.muns);
 */
export const useMapFrame = (
  meshUrl: string,
  codes: string[],
  selectedCodes: string[],
) => {
  const { status, features } = useMesh(meshUrl);

  // Formato da malha inteira: o card não muda de altura ao trocar de estado.
  const aspectRatio = useMemo(
    () => getMapAspectRatio(getMapBounds(features)),
    [features],
  );
  const region = useRegionMap(meshUrl, features, codes);
  const framing = useFraming(
    region.visible,
    region.areaBounds,
    aspectRatio,
    selectedCodes,
  );

  return {
    status,
    features,
    aspectRatio,
    framing,
    canPan: useMousePointer(),
    ...region,
  };
};

export const MapLegend = ({
  buckets,
}: {
  buckets: readonly ChoroplethBucket[];
}) => (
  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-grey-1000">
    {buckets.map((bucket) => (
      <li key={bucket.label} className="flex items-center gap-2">
        <span
          aria-hidden
          className="size-3.5 shrink-0 rounded-full border border-grey-300"
          style={{ backgroundColor: bucket.color }}
        />
        {bucket.label}
      </li>
    ))}
  </ul>
);

export const MeshFallback = ({ status }: { status: MeshStatus }) => (
  <ChartNotice>
    {status === "error"
      ? "Não foi possível carregar o mapa."
      : status === "ready"
        ? "Nenhum município deste filtro aparece na malha do IBGE."
        : "Carregando mapa…"}
  </ChartNotice>
);
