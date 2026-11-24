"use client";

import {
  type MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { ReadyGeodata } from "@/components/PanelMap/useGeodata";
import type {
  MapFeatureProps,
  PanelIndicator,
} from "@/features/panelMap/geodataTypes";
import {
  fitTargetFor,
  type FitSources,
  selectionFilter,
  veilFilters,
} from "@/features/panelMap/mapLayers";
import {
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
  indicator: PanelIndicator;
  ano: number;
  area: TerritorialArea;
  recorte: MapRecorte;
  deepest: MapLevel;
  aridez: PanelMapAridez;
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

function useSourcesAndPaint(args: PanelMapLayersArgs, sources: FitSources) {
  const { engine, geodata, indicator, ano, area, aridez } = args;

  useEffect(() => engine?.setSources(sources), [engine, sources]);
  useEffect(() => {
    const { styles } = geodata;
    const paint = featurePaint(styles, indicator, ano, aridez === "base");

    engine?.setIndicatorPaint({
      ...paint,
      stateOutline: styles.stateOutline,
      area,
    });
  }, [engine, geodata, indicator, ano, area, aridez]);
}

function fitRecorte(
  engine: PanelMapEngine,
  recorte: MapRecorte,
  area: TerritorialArea,
  sources: FitSources,
): void {
  const target = fitTargetFor(recorte, area, sources);

  if (target) engine.fitTo(target);
}

// IMPORTANT: o recorte que o próprio zoom escolheu não é enquadrado (o mapa
// pularia a cada gesto); qualquer outro (barra, limpar, clique, montagem, área
// nova) é. O marcador é consumido a cada recorte novo: "limpar" e escolher de
// novo o mesmo estado pela barra precisa enquadrar.
function useRecorteFraming(
  args: PanelMapLayersArgs,
  sources: FitSources,
  zoomEmittedRef: MutableRefObject<MapRecorte | null>,
) {
  const { engine, indicator, area } = args;
  const recorte = useStableRecorte(args.recorte);

  useEffect(() => {
    if (!engine) return;
    const emitted = zoomEmittedRef.current;
    const fromZoom = emitted !== null && sameRecorte(emitted, recorte);

    zoomEmittedRef.current = null;
    engine.setVeil(veilFilters(recorte));
    engine.setSelection(selectionFilter(recorte, indicator));
    if (!fromZoom) fitRecorte(engine, recorte, area, sources);
  }, [engine, recorte, area, indicator, sources, zoomEmittedRef]);
}

// Clique emite o recorte direto e o enquadramento vem da mudança de props
// (não é marcado como do zoom); clicar no que já está escolhido não muda nada,
// então só enquadra.
function handleFeatureClick(
  feature: MapFeatureProps,
  args: PanelMapLayersArgs,
  sources: FitSources,
  zoomEmittedRef: MutableRefObject<MapRecorte | null>,
): void {
  const { engine, indicator, deepest, recorte, area } = args;
  const next = recorteForClick(feature, indicator, deepest);

  zoomEmittedRef.current = null;
  if (!sameRecorte(next, recorte)) return args.onRecorteChange(next);
  if (engine) fitRecorte(engine, next, area, sources);
}

// WHY deps com `args` inteiro: o recorte do pai muda de objeto a cada render,
// então o callback é trocado a cada render de qualquer jeito (troca barata).
function useFeatureClicks(
  args: PanelMapLayersArgs,
  sources: FitSources,
  zoomEmittedRef: MutableRefObject<MapRecorte | null>,
) {
  useEffect(() => {
    args.engine?.onClickFeature((feature) =>
      handleFeatureClick(feature, args, sources, zoomEmittedRef),
    );
  }, [args, sources, zoomEmittedRef]);
}

/**
 * Liga as camadas do motor às props: fontes, cores do ano, véu, seleção,
 * enquadramento e clique. Devolve o `onRecorteChange` que o zoom deve usar —
 * ele marca o recorte como escolhido pelo próprio mapa.
 *
 * @example const onZoomRecorte = usePanelMapLayers(args); useMapRecorte({ engine, recorte, deepest, onRecorteChange: onZoomRecorte });
 */
export function usePanelMapLayers(args: PanelMapLayersArgs) {
  const sources = useFitSources(args.geodata);
  const zoomEmittedRef = useRef<MapRecorte | null>(null);
  const { onRecorteChange } = args;

  useSourcesAndPaint(args, sources);
  useRecorteFraming(args, sources, zoomEmittedRef);
  useFeatureClicks(args, sources, zoomEmittedRef);

  return useCallback(
    (recorte: MapRecorte) => {
      zoomEmittedRef.current = recorte;
      onRecorteChange(recorte);
    },
    [onRecorteChange],
  );
}
