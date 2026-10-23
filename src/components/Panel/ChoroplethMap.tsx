"use client";

import { useCallback, useMemo } from "react";
import { EChart } from "@/components/EChart/EChart";
import { ChartCard } from "@/components/Panel/ChartCard";
import {
  MAP_RENDERER,
  MapLegend,
  MeshFallback,
  useMapFrame,
} from "@/components/Panel/mapParts";
import {
  buildChoroplethOption,
  type ChoroplethRegion,
  type ValueFormatter,
} from "@/features/panels/chartOptions";
import type { ChoroplethBucket } from "@/features/panels/choropleth";

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

export const ChoroplethMap = (props: ChoroplethMapProps) => {
  const { selectedCode, regions, buckets, valueLabel, formatValue } = props;
  const codes = useMemo(() => regions.map((region) => region.code), [regions]);
  const { status, aspectRatio, mapName, areaBounds, framing, canPan } =
    useMapFrame(props.meshUrl, codes, selectedCode ? [selectedCode] : []);
  const buildOption = useCallback(
    () =>
      buildChoroplethOption({
        regions,
        buckets,
        valueLabel,
        formatValue,
        selectedCode,
        mapName,
        framing,
        canPan,
      }),
    [
      regions,
      buckets,
      valueLabel,
      formatValue,
      selectedCode,
      mapName,
      framing,
      canPan,
    ],
  );

  return (
    <ChartCard title={props.title}>
      {status === "ready" && areaBounds ? (
        <EChart
          buildOption={buildOption}
          label={`Mapa coroplético: ${props.title}`}
          className="w-full"
          style={{ aspectRatio }}
          renderer={MAP_RENDERER}
          onItemClick={props.onSelectRegion}
        />
      ) : (
        <MeshFallback status={status} />
      )}
      <MapLegend buckets={props.buckets} />
    </ChartCard>
  );
};
