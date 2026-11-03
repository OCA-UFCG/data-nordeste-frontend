"use client";

import { type CSSProperties, type ReactNode, useMemo } from "react";
import { EChart } from "@/components/EChart/EChart";
import { ChartCard } from "@/components/Panel/cards/ChartCard";
import type { DataTableContent } from "@/components/Panel/cards/DataTable";
import {
  MAP_RENDERER,
  MapLegend,
  MeshFallback,
  useMapFrame,
} from "@/components/Panel/charts/mapParts";
import {
  buildChoroplethColorOption,
  buildChoroplethFrameOption,
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
  highlightCodes?: ReadonlySet<string>;
  table?: DataTableContent;
  legend?: ReactNode;
  onSelectRegion: (code: string) => void;

  // Do xl em diante ocupa a altura do pai; abaixo, segue o formato da malha.
  fill?: boolean;
  background?: string;
};

export const ChoroplethMap = (props: ChoroplethMapProps) => {
  const { selectedCode, highlightCodes, regions, buckets } = props;
  const { valueLabel, formatValue } = props;
  const codes = useMemo(() => regions.map((region) => region.code), [regions]);
  const { status, aspectRatio, mapName, areaBounds, framing, canPan } =
    useMapFrame(props.meshUrl, codes, selectedCode ? [selectedCode] : []);

  // Separados: passar o mouse na lista de atividades troca só o destaque, que
  // entra por merge sem redesenhar os ~1.800 municípios nem desfazer o zoom.
  const frameOption = useMemo(
    () => buildChoroplethFrameOption({ mapName, framing, canPan }),
    [mapName, framing, canPan],
  );
  const colorOption = useMemo(
    () =>
      buildChoroplethColorOption({
        regions,
        buckets,
        valueLabel,
        formatValue,
        selectedCode,
        highlightCodes,
      }),
    [regions, buckets, valueLabel, formatValue, selectedCode, highlightCodes],
  );

  const map =
    status === "ready" && areaBounds ? (
      <EChart
        option={frameOption}
        label={`Mapa coroplético: ${props.title}`}
        className={
          props.fill
            ? "aspect-(--map-ratio) w-full xl:aspect-auto xl:min-h-0 xl:flex-1"
            : "w-full"
        }
        style={
          props.fill
            ? ({
                "--map-ratio": aspectRatio,
                "backgroundColor": props.background,
              } as CSSProperties)
            : { aspectRatio, backgroundColor: props.background }
        }
        renderer={MAP_RENDERER}
        morph={false}
        restyleOption={colorOption}
        onItemClick={props.onSelectRegion}
      />
    ) : (
      <MeshFallback status={status} />
    );

  if (props.fill) {
    return (
      <ChartCard
        title={props.title}
        table={props.table}
        tableClassName="h-64 sm:h-72 xl:h-auto xl:min-h-0 xl:flex-1"
      >
        <div className="relative flex min-h-0 flex-1 flex-col">
          {map}
          {props.legend ?? <MapLegend buckets={props.buckets} overlay />}
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title={props.title} table={props.table}>
      {map}
      {props.legend ?? <MapLegend buckets={props.buckets} />}
    </ChartCard>
  );
};
