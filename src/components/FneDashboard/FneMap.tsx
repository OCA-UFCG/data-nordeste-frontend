"use client";

import { type ReactNode, useId, useMemo, useState } from "react";
import { LayeredMap } from "@/components/Panel/charts/LayeredMap";
import { previewOnMouse } from "@/components/Panel/charts/RankedBars";
import {
  FNE_YEAR_RANGE,
  type FneVisao,
} from "@/features/panels/fne/fneFilters";
import {
  fneLayerTitle,
  groupFneRegionsByBucket,
  toFneLayeredRegions,
  type FneBucketGroup,
} from "@/features/panels/fne/fneMap";
import type { FnePanelData } from "@/features/panels/fne/fnePanel";
import { formatNumber } from "@/features/panels/format";
import { BORDER_COLOR } from "@/features/panels/layeredMap";
import { listYears } from "@/features/panels/territorialFilters";

const MESH_URL = "/maps/municipios-sudene.json";

// Do mais antigo ao mais recente, como a lista de camadas do ArcGIS lida da esquerda.
const LAYER_YEARS = [...listYears(FNE_YEAR_RANGE)].sort((a, b) => a - b);

const CHIP =
  "flex h-9 min-w-14 cursor-pointer items-center justify-center rounded-md border px-3 text-sm font-medium transition has-[:checked]:border-green-800 has-[:checked]:bg-green-800 has-[:checked]:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-green-900";

const YearLayers = ({
  ano,
  onChange,
}: {
  ano: number;
  onChange: (ano: number) => void;
}) => {
  const name = useId();

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold text-grey-1100">
        Camada do ano
      </legend>
      <div className="flex flex-wrap gap-2">
        {LAYER_YEARS.map((year) => (
          <label key={year} className={`${CHIP} border-grey-300 bg-white`}>
            <input
              type="radio"
              name={name}
              value={year}
              checked={year === ano}
              onChange={() => onChange(year)}
              className="sr-only"
            />
            {year}
          </label>
        ))}
      </div>
    </fieldset>
  );
};

const BorderToggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <label className="flex h-9 cursor-pointer items-center gap-2 self-end text-sm font-medium text-grey-1100">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="size-4 accent-green-800"
    />
    Limite estadual
  </label>
);

const BucketLegend = ({
  grupos,
  bucket,
  onSelect,
  onPreview,
}: {
  grupos: FneBucketGroup[];
  bucket: string | null;
  onSelect: (bucket: string | null) => void;
  onPreview: (bucket: string | null) => void;
}) => (
  <ul
    className="flex flex-wrap gap-1.5"
    onPointerLeave={previewOnMouse(onPreview, null)}
  >
    {grupos.map(({ bucket: item, codes }) => (
      <li key={item.label}>
        <button
          type="button"
          aria-pressed={bucket === item.label}
          onClick={() => onSelect(bucket === item.label ? null : item.label)}
          onPointerEnter={previewOnMouse(onPreview, item.label)}
          onFocus={() => onPreview(item.label)}
          onBlur={() => onPreview(null)}
          className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md border border-grey-200 px-2 text-sm text-grey-1000 transition-colors hover:bg-green-100 focus-visible:outline-2 focus-visible:outline-green-800 aria-pressed:border-green-800 aria-pressed:bg-green-100 motion-reduce:transition-none"
        >
          <span
            aria-hidden
            className="size-3.5 shrink-0 rounded-full border border-grey-300"
            style={{ backgroundColor: item.color }}
          />
          {item.label} ({formatNumber(codes.length)})
        </button>
      </li>
    ))}
  </ul>
);

const FneMapLegend = ({
  title,
  showBorders,
  children,
}: {
  title: string;
  showBorders: boolean;
  children: ReactNode;
}) => (
  <div className="mt-3 flex flex-col gap-2">
    <p className="text-sm font-semibold text-grey-1100">{title}</p>
    {children}
    {showBorders ? (
      <p className="flex items-center gap-2 text-sm text-grey-1000">
        <span
          aria-hidden
          className="h-0.5 w-5 shrink-0"
          style={{ backgroundColor: BORDER_COLOR }}
        />
        Limite estadual
      </p>
    ) : null}
  </div>
);

/**
 * Destaque do mapa: os municípios sob o mouse (Top 20 ou estado) vencem a
 * classe da legenda (prévia ou fixada).
 * @example const highlight = useFneMapHighlight(data.mapa, visao)
 */
export const useFneMapHighlight = (
  mapa: FnePanelData["mapa"],
  visao: FneVisao,
) => {
  const grupos = useMemo(
    () => groupFneRegionsByBucket(mapa, visao),
    [mapa, visao],
  );

  // Fixada por aba: as classes de quantidade e de valor são outras.
  const [pinned, setPinned] = useState<{ visao: FneVisao; label: string }>();
  const bucket = pinned?.visao === visao ? pinned.label : null;
  const setBucket = (label: string | null) =>
    setPinned(label ? { visao, label } : undefined);
  const [bucketPreview, setBucketPreview] = useState<string | null>(null);
  const [previewCodes, setPreviewCodes] = useState<string[] | null>(null);
  const highlightCodes = useMemo(() => {
    if (previewCodes) return new Set(previewCodes);
    const shown = bucketPreview ?? bucket;
    const grupo = grupos.find((item) => item.bucket.label === shown);

    return grupo ? new Set(grupo.codes) : undefined;
  }, [previewCodes, bucketPreview, bucket, grupos]);

  return {
    grupos,
    bucket,
    setBucket,
    setBucketPreview,
    setPreviewCodes,
    highlightCodes,
  };
};

export type FneMapHighlight = ReturnType<typeof useFneMapHighlight>;

export const FneMap = ({
  data,
  visao,
  onSelectAno,
  onSelectMunicipality,
  highlight,
}: {
  data: FnePanelData;
  visao: FneVisao;
  onSelectAno: (ano: number) => void;
  onSelectMunicipality: (cdMun: string) => void;
  highlight: FneMapHighlight;
}) => {
  const [showBorders, setShowBorders] = useState(true);
  const regions = useMemo(
    () => toFneLayeredRegions(data.mapa, visao),
    [data.mapa, visao],
  );
  const layerTitle = fneLayerTitle(data.filters.ano, visao);

  return (
    <LayeredMap
      title="Mapa das contratações por município"
      meshUrl={MESH_URL}
      regions={regions}
      showBorders={showBorders}
      selectedCodes={data.filters.muns}
      highlightCodes={highlight.highlightCodes}
      onSelectRegion={onSelectMunicipality}
      controls={
        <div className="mb-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-grey-200 pb-3">
          <YearLayers ano={data.filters.ano} onChange={onSelectAno} />
          <BorderToggle checked={showBorders} onChange={setShowBorders} />
        </div>
      }
      fill
      legend={
        <FneMapLegend title={layerTitle} showBorders={showBorders}>
          <BucketLegend
            grupos={highlight.grupos}
            bucket={highlight.bucket}
            onSelect={highlight.setBucket}
            onPreview={highlight.setBucketPreview}
          />
        </FneMapLegend>
      }
    />
  );
};
