"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EChart } from "@/components/EChart/EChart";
import { ChartCard, ChartNotice } from "@/components/Panel/ChartCard";
import {
  buildChoroplethOption,
  type ChoroplethRegion,
  type ValueFormatter,
} from "@/features/panels/chartOptions";
import type { ChoroplethBucket } from "@/features/panels/choropleth";
import {
  getMapAspectRatio,
  getMapBounds,
  getMunicipalityFocusBounds,
  mapNameFor,
  selectMapFeatures,
  type MapFeature,
} from "@/features/panels/mapFraming";
import { registerChartMapFeatures } from "@/lib/echarts";

type MeshStatus = "loading" | "ready" | "error";

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
  regions: ChoroplethRegion[],
) =>
  useMemo(() => {
    const codes = regions.map((region) => region.code);
    const visible = selectMapFeatures(features, codes);
    const mapName = mapNameFor(meshUrl, codes);

    if (visible.length) registerChartMapFeatures(mapName, visible);

    return { mapName, visible, areaBounds: getMapBounds(visible) };
  }, [meshUrl, features, regions]);

const MapLegend = ({ buckets }: { buckets: readonly ChoroplethBucket[] }) => (
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

export type ChoroplethMapProps = {
  title: string;
  meshUrl: string;
  regions: ChoroplethRegion[];
  buckets: readonly ChoroplethBucket[];
  valueLabel: string;
  formatValue: ValueFormatter;
  selectedCode?: string;
  onSelectRegion: (code: string) => void;
};

const MeshFallback = ({ status }: { status: MeshStatus }) => (
  <ChartNotice>
    {status === "error"
      ? "Não foi possível carregar o mapa."
      : status === "ready"
        ? "Nenhum município deste filtro aparece na malha do IBGE."
        : "Carregando mapa…"}
  </ChartNotice>
);

export const ChoroplethMap = (props: ChoroplethMapProps) => {
  const { status, features } = useMesh(props.meshUrl);
  const { mapName, visible, areaBounds } = useRegionMap(
    props.meshUrl,
    features,
    props.regions,
  );
  const canPan = useMousePointer();
  const { selectedCode, regions, buckets, valueLabel, formatValue } = props;
  const bounds = useMemo(
    () =>
      (selectedCode && getMunicipalityFocusBounds(visible, selectedCode)) ||
      areaBounds,
    [visible, selectedCode, areaBounds],
  );
  const buildOption = useCallback(
    () =>
      buildChoroplethOption({
        regions,
        buckets,
        valueLabel,
        formatValue,
        selectedCode,
        mapName,
        bounds,
        canPan,
      }),
    [
      regions,
      buckets,
      valueLabel,
      formatValue,
      selectedCode,
      mapName,
      bounds,
      canPan,
    ],
  );

  return (
    <ChartCard title={props.title}>
      {status === "ready" && bounds ? (
        <EChart
          buildOption={buildOption}
          label={`Mapa coroplético: ${props.title}`}
          className="w-full"
          style={{ aspectRatio: getMapAspectRatio(bounds) }}
          onItemClick={props.onSelectRegion}
        />
      ) : (
        <MeshFallback status={status} />
      )}
      <MapLegend buckets={props.buckets} />
    </ChartCard>
  );
};
