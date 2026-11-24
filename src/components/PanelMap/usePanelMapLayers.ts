"use client";

import type { FeatureCollection } from "geojson";
import { useEffect, useMemo, useState } from "react";

import type { ReadyGeodata } from "@/components/PanelMap/useGeodata";
import type {
  MapFeatureProps,
  PanelIndicator,
} from "@/features/panelMap/geodataTypes";
import {
  type FeatureLevel,
  recorteForLevel,
} from "@/features/panelMap/featureLevel";
import {
  fitTargetFor,
  type FitSources,
  selectionFilter,
  veilFilters,
} from "@/features/panelMap/mapLayers";
import {
  levelOfRecorte,
  type MapLevel,
  type MapRecorte,
  sameRecorte,
} from "@/features/panelMap/mapRecorte";
import { recorteForClick } from "@/features/panelMap/mapSelection";
import { featurePaint } from "@/features/panelMap/qgisPaint";
import type { PanelMapAridez } from "@/features/panelMap/aridezRaster";
import type { TerritorialArea } from "@/features/panels/territorialFilters";
import type { PanelMapEngine } from "@/lib/panelMapEngine";

export type PanelMapLayersArgs = {
  engine: PanelMapEngine | null;
  geodata: ReadyGeodata;

  // `estados_<area>.geojson` da área atual (ou o `estados.geojson` inteiro
  // enquanto ele carrega): hover, seleção e enquadramento de estado.
  areaStates: FeatureCollection;
  indicator: PanelIndicator;
  ano: number;
  area: TerritorialArea;
  recorte: MapRecorte;
  deepest: MapLevel;
  aridez: PanelMapAridez;
  level: FeatureLevel;
  onRecorteChange: (recorte: MapRecorte) => void;
};

/**
 * O mesmo recorte enquanto a seleção não muda. O pai costuma montar um objeto
 * novo a cada render (`territorialToRecorte(filters)`); sem isto cada render
 * enquadraria o mapa de novo.
 */
function useStableRecorte(recorte: MapRecorte): MapRecorte {
  const [stable, setStable] = useState(recorte);

  if (!sameRecorte(stable, recorte)) setStable(recorte);

  return sameRecorte(stable, recorte) ? stable : recorte;
}

function useFitSources(geodata: ReadyGeodata): FitSources {
  return useMemo(
    () => ({
      features: geodata.features,
      states: geodata.states,
      areas: geodata.areas,
    }),
    [geodata],
  );
}

function usePaint(args: PanelMapLayersArgs) {
  const { geodata, indicator, ano, aridez } = args;

  return useMemo(
    () => featurePaint(geodata.styles, indicator, ano, aridez === "base"),
    [geodata, indicator, ano, aridez],
  );
}

function useSourcesAndPaint(args: PanelMapLayersArgs, sources: FitSources) {
  const { engine, geodata, area, areaStates } = args;
  const paint = usePaint(args);

  useEffect(() => engine?.setSources(sources), [engine, sources]);
  useEffect(() => engine?.setAreaStates(areaStates), [engine, areaStates]);
  useEffect(() => {
    const { stateOutline } = geodata.styles;

    engine?.setIndicatorPaint({ ...paint, stateOutline, area });
  }, [engine, geodata, paint, area]);
}

// O recorte como o nível das feições o desenha (`recorteForLevel`).
function fitRecorte(
  engine: PanelMapEngine,
  recorte: MapRecorte,
  { area, level }: { area: TerritorialArea; level: FeatureLevel },
  sources: FitSources,
): void {
  const drawn = recorteForLevel(recorte, level);
  const target = fitTargetFor(drawn, area, sources);

  if (target) engine.fitTo(target);
}

// Os estados da área só entram no enquadramento de estado (a parte do estado
// dentro da área). WHY: assim a chegada do arquivo da área (assíncrona) só
// reenquadra quando o enquadramento depende dele.
function fitStatesFor(
  args: PanelMapLayersArgs,
  recorte: MapRecorte,
): FeatureCollection | undefined {
  const drawn = recorteForLevel(recorte, args.level);

  return levelOfRecorte(drawn) === "estado" ? args.areaStates : undefined;
}

// IMPORTANT: todo recorte novo é enquadrado (zoom, arraste, clique, barra,
// limpar, montagem, área nova), com o mesmo teto de zoom do `fitTo`. Não há
// exceção para o recorte que o próprio mapa emitiu: o filtro aplicado pelo zoom
// centra o mapa como o da barra. WARNING: o enquadramento é programático (o
// `moveend` dele não gera filtro e só troca a âncora do zoom), então não há
// ciclo. `useStableRecorte` evita enquadrar duas vezes quando o recorte volta
// do servidor com o mesmo conteúdo.
function useRecorteFraming(
  args: PanelMapLayersArgs,
  sources: FitSources,
  recorte: MapRecorte,
) {
  const { engine, area, level } = args;
  const areaStates = fitStatesFor(args, recorte);

  useEffect(() => {
    if (!engine) return;
    const drawn = recorteForLevel(recorte, level);
    const fitSources = { ...sources, areaStates };

    engine.setVeil(veilFilters(drawn));
    engine.setSelection(selectionFilter(drawn, level));
    fitRecorte(engine, recorte, { area, level }, fitSources);
  }, [engine, recorte, area, level, sources, areaStates]);
}

// Clique emite o recorte direto e o enquadramento vem da mudança de props.
// Só emite quando o recorte muda: clicar no vazio com a área inteira não faz
// nada.
function handleMapClick(
  clicked: MapFeatureProps | null,
  args: PanelMapLayersArgs,
): void {
  const { level, deepest, recorte } = args;
  const next = recorteForClick(clicked, level, deepest, recorte);

  if (sameRecorte(next, recorte)) return;
  args.onRecorteChange(next);
}

// WHY deps com `args` inteiro: o recorte do pai muda de objeto a cada render,
// então o callback é trocado a cada render de qualquer jeito (troca barata).
function useMapClicks(args: PanelMapLayersArgs) {
  useEffect(() => {
    args.engine?.onMapClick((clicked) => handleMapClick(clicked, args));
  }, [args]);
}

/**
 * Liga as camadas do motor às props: fontes, cores do ano, véu, seleção,
 * enquadramento e clique. Todo recorte novo é enquadrado, venha de onde vier.
 *
 * @example usePanelMapLayers(args);
 */
export function usePanelMapLayers(args: PanelMapLayersArgs): void {
  const sources = useFitSources(args.geodata);
  const recorte = useStableRecorte(args.recorte);

  useSourcesAndPaint(args, sources);
  useRecorteFraming(args, sources, recorte);
  useMapClicks(args);
}
