"use client";

import { useCallback, useMemo, type ReactNode } from "react";
import { EChart } from "@/components/EChart/EChart";
import { ChartCard } from "@/components/Panel/ChartCard";
import {
  MAP_RENDERER,
  MeshFallback,
  useMapFrame,
} from "@/components/Panel/mapParts";
import {
  buildLayeredMapOption,
  type LayeredRegion,
} from "@/features/panels/layeredMap";
import { getStateBorders } from "@/features/panels/stateBorders";

export type LayeredMapProps = {
  title: string;
  meshUrl: string;
  regions: LayeredRegion[];
  showBorders: boolean;
  selectedCodes: string[];
  onSelectRegion: (code: string) => void;
  controls: ReactNode;
  legend: ReactNode;
};

export const LayeredMap = (props: LayeredMapProps) => {
  const { regions, selectedCodes, showBorders } = props;
  const codes = useMemo(() => regions.map((region) => region.code), [regions]);
  const frame = useMapFrame(props.meshUrl, codes, selectedCodes);
  const { features, mapName, areaBounds, framing, canPan } = frame;

  // Da malha inteira, não só dos visíveis: com filtro de Semiárido ou bioma, a
  // borda dos visíveis contornaria o recorte, não os estados.
  const borders = useMemo(
    () => (showBorders ? getStateBorders(features) : null),
    [showBorders, features],
  );
  const buildOption = useCallback(
    () =>
      buildLayeredMapOption({
        regions,
        selectedCodes,
        borders,
        mapName,
        framing,
        canPan,
      }),
    [regions, selectedCodes, borders, mapName, framing, canPan],
  );

  return (
    <ChartCard title={props.title}>
      {props.controls}
      {frame.status === "ready" && areaBounds ? (
        <EChart
          buildOption={buildOption}
          label={`Mapa coroplético: ${props.title}`}
          className="w-full"
          style={{ aspectRatio: frame.aspectRatio }}
          renderer={MAP_RENDERER}
          onItemClick={props.onSelectRegion}
        />
      ) : (
        <MeshFallback status={frame.status} />
      )}
      {props.legend}
    </ChartCard>
  );
};
