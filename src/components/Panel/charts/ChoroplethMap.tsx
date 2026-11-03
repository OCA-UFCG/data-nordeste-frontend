"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { EChart } from "@/components/EChart/EChart";
import { ChartCard, ChartNotice } from "@/components/Panel/cards/ChartCard";
import type { DataTableContent } from "@/components/Panel/cards/DataTable";
import {
  buildChoroplethColorOption,
  buildChoroplethFrameOption,
  type ChoroplethRegion,
  type ValueFormatter,
} from "@/features/panels/chartOptions";
import type { ChoroplethBucket } from "@/features/panels/choropleth";
import {
  getMapAspectRatio,
  getMapBounds,
  getMapFraming,
  getMunicipalityFocusBounds,
  mapNameFor,
  selectMapFeatures,
  type MapFeature,
} from "@/features/panels/mapFraming";
import { registerChartMapFeatures } from "@/lib/echarts";

type MeshStatus = "loading" | "ready" | "error";

// PERF: em SVG, cada passo do arrasto mexe em ~1.800 <path>; canvas é um bitmap só.
const MAP_RENDERER = "canvas";

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

// `overlay`: no desktop, a legenda fica sobre o oceano no canto inferior direito
// e o mapa ganha a altura dela; no celular, o mapa é pequeno e ela vai para baixo.
const MapLegend = ({
  buckets,
  overlay = false,
}: {
  buckets: readonly ChoroplethBucket[];
  overlay?: boolean;
}) => (
  <ul
    className={
      overlay
        ? "mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-grey-1000 lg:pointer-events-none lg:absolute lg:bottom-0 lg:right-0 lg:mt-0 lg:flex lg:flex-col lg:gap-1 lg:rounded-md lg:bg-white/85 lg:p-2"
        : "mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-grey-1000"
    }
  >
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
  highlightCodes?: ReadonlySet<string>;
  table?: DataTableContent;
  info?: ReactNode;
  onSelectRegion: (code: string) => void;

  // Do xl em diante ocupa a altura do pai; abaixo, segue o formato da malha.
  fill?: boolean;
  background?: string;
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

  // Formato da malha inteira: o card não muda de altura ao trocar de estado.
  const aspectRatio = useMemo(
    () => getMapAspectRatio(getMapBounds(features)),
    [features],
  );
  const { mapName, visible, areaBounds } = useRegionMap(
    props.meshUrl,
    features,
    props.regions,
  );
  const canPan = useMousePointer();
  const { selectedCode, highlightCodes, regions, buckets } = props;
  const { valueLabel, formatValue } = props;
  const framing = useMemo(() => {
    const focusBounds = selectedCode
      ? getMunicipalityFocusBounds(visible, selectedCode)
      : undefined;

    return areaBounds
      ? getMapFraming(areaBounds, aspectRatio, focusBounds)
      : undefined;
  }, [visible, selectedCode, areaBounds, aspectRatio]);

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
        info={props.info}
        tableClassName="h-64 sm:h-72 xl:h-auto xl:min-h-0 xl:flex-1"
      >
        <div className="relative flex min-h-0 flex-1 flex-col">
          {map}
          <MapLegend buckets={props.buckets} overlay />
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title={props.title} table={props.table} info={props.info}>
      {map}
      <MapLegend buckets={props.buckets} />
    </ChartCard>
  );
};
