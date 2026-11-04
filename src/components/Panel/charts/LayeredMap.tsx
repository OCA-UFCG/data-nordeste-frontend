"use client";

import { type CSSProperties, useMemo, type ReactNode } from "react";
import { EChart } from "@/components/EChart/EChart";
import { ChartCard } from "@/components/Panel/cards/ChartCard";
import {
  MAP_RENDERER,
  MeshFallback,
  useMapFrame,
} from "@/components/Panel/charts/mapParts";
import {
  buildLayeredColorOption,
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
  highlightCodes?: ReadonlySet<string>;
  onSelectRegion: (code: string) => void;
  controls: ReactNode;
  legend: ReactNode;

  // Do lg em diante ocupa a altura do pai; abaixo, segue o formato da malha.
  fill?: boolean;
};

export const LayeredMap = (props: LayeredMapProps) => {
  const { regions, selectedCodes, highlightCodes, showBorders } = props;
  const codes = useMemo(() => regions.map((region) => region.code), [regions]);
  const frame = useMapFrame(props.meshUrl, codes, selectedCodes);
  const { features, mapName, areaBounds, framing, canPan } = frame;

  // Da malha inteira, não só dos visíveis: com filtro de Semiárido ou bioma, a
  // borda dos visíveis contornaria o recorte, não os estados.
  const borders = useMemo(
    () => (showBorders ? getStateBorders(features) : null),
    [showBorders, features],
  );
  const frameOption = useMemo(
    () => buildLayeredMapOption({ mapName, framing, canPan, borders }),
    [mapName, framing, canPan, borders],
  );

  // Separada do quadro: o destaque da lista entra por merge, sem redesenhar
  // os ~1.800 municípios nem desfazer o zoom.
  const colorOption = useMemo(
    () => buildLayeredColorOption({ regions, selectedCodes, highlightCodes }),
    [regions, selectedCodes, highlightCodes],
  );

  return (
    <ChartCard title={props.title}>
      {props.controls}
      {frame.status === "ready" && areaBounds ? (
        <EChart
          option={frameOption}
          restyleOption={colorOption}
          label={`Mapa coroplético: ${props.title}`}
          className={
            props.fill
              ? "aspect-(--map-ratio) w-full lg:aspect-auto lg:min-h-0 lg:flex-1"
              : "w-full"
          }
          style={
            props.fill
              ? ({ "--map-ratio": frame.aspectRatio } as CSSProperties)
              : { aspectRatio: frame.aspectRatio }
          }
          renderer={MAP_RENDERER}
          morph={false}
          onItemClick={props.onSelectRegion}
        />
      ) : (
        <MeshFallback status={frame.status} />
      )}
      {props.legend}
    </ChartCard>
  );
};
