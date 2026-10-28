"use client";

import { useId, useMemo, useState } from "react";
import { LayeredMap } from "@/components/Panel/LayeredMap";
import { MapLegend } from "@/components/Panel/mapParts";
import {
  FNE_YEAR_RANGE,
  type FneVisao,
} from "@/features/panels/fne/fneFilters";
import { FNE_MAP_BUCKETS } from "@/features/panels/fne/fneLabels";
import {
  fneLayerTitle,
  toFneLayeredRegions,
} from "@/features/panels/fne/fneMap";
import type { FnePanelData } from "@/features/panels/fne/fnePanel";
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

const FneMapLegend = ({
  title,
  visao,
  showBorders,
}: {
  title: string;
  visao: FneVisao;
  showBorders: boolean;
}) => (
  <div className="mt-3 flex flex-col gap-1">
    <p className="text-sm font-semibold text-grey-1100">{title}</p>
    <MapLegend buckets={FNE_MAP_BUCKETS[visao]} />
    {showBorders ? (
      <p className="mt-2 flex items-center gap-2 text-sm text-grey-1000">
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

export const FneMap = ({
  data,
  visao,
  onSelectAno,
  onSelectMunicipality,
}: {
  data: FnePanelData;
  visao: FneVisao;
  onSelectAno: (ano: number) => void;
  onSelectMunicipality: (cdMun: string) => void;
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
      onSelectRegion={onSelectMunicipality}
      controls={
        <div className="mb-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-grey-200 pb-3">
          <YearLayers ano={data.filters.ano} onChange={onSelectAno} />
          <BorderToggle checked={showBorders} onChange={setShowBorders} />
        </div>
      }
      legend={
        <FneMapLegend
          title={layerTitle}
          visao={visao}
          showBorders={showBorders}
        />
      }
    />
  );
};
