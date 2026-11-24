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
  type FeatureLevel,
  type MapFeatureMode,
  recorteForLevel,
  stateMeshPaint,
} from "@/features/panelMap/featureLevel";
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
  mode: MapFeatureMode;
  onRecorteChange: (recorte: MapRecorte) => void;
};

const NO_UFS: string[] = [];

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

// A malha dos estados pinta os escolhidos mais forte: só ela depende da UF.
function usePaint(args: PanelMapLayersArgs, meshUfs: string[]) {
  const { geodata, indicator, ano, aridez } = args;
  const { stateMesh } = args.mode;

  return useMemo(
    () =>
      stateMesh
        ? stateMeshPaint(geodata.styles, meshUfs)
        : featurePaint(geodata.styles, indicator, ano, aridez === "base"),
    [geodata, indicator, ano, aridez, stateMesh, meshUfs],
  );
}

function useSourcesAndPaint(
  args: PanelMapLayersArgs,
  sources: FitSources,
  recorte: MapRecorte,
) {
  const { engine, geodata, area, mode } = args;
  const paint = usePaint(args, mode.stateMesh ? recorte.uf : NO_UFS);

  useEffect(() => engine?.setSources(sources), [engine, sources]);
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

// IMPORTANT: o recorte que o próprio zoom escolheu não é enquadrado (o mapa
// pularia a cada gesto); qualquer outro (barra, limpar, clique, montagem, área
// nova) é. O marcador é consumido a cada recorte novo: "limpar" e escolher de
// novo o mesmo estado pela barra precisa enquadrar.
function useRecorteFraming(
  args: PanelMapLayersArgs,
  sources: FitSources,
  recorte: MapRecorte,
  zoomEmittedRef: MutableRefObject<MapRecorte | null>,
) {
  const { engine, area } = args;
  const { level } = args.mode;

  useEffect(() => {
    if (!engine) return;
    const emitted = zoomEmittedRef.current;
    const fromZoom = emitted !== null && sameRecorte(emitted, recorte);
    const drawn = recorteForLevel(recorte, level);

    zoomEmittedRef.current = null;
    engine.setVeil(veilFilters(drawn));
    engine.setSelection(selectionFilter(drawn, level));
    if (!fromZoom) fitRecorte(engine, recorte, { area, level }, sources);
  }, [engine, recorte, area, level, sources, zoomEmittedRef]);
}

// Clique emite o recorte direto e o enquadramento vem da mudança de props
// (não é marcado como do zoom). Só emite quando o recorte muda: clicar no vazio
// com a área inteira não faz nada.
function handleMapClick(
  clicked: MapFeatureProps | null,
  args: PanelMapLayersArgs,
  zoomEmittedRef: MutableRefObject<MapRecorte | null>,
): void {
  const { mode, deepest, recorte } = args;
  const next = recorteForClick(clicked, mode.level, deepest, recorte);

  if (sameRecorte(next, recorte)) return;
  zoomEmittedRef.current = null;
  args.onRecorteChange(next);
}

// WHY deps com `args` inteiro: o recorte do pai muda de objeto a cada render,
// então o callback é trocado a cada render de qualquer jeito (troca barata).
function useMapClicks(
  args: PanelMapLayersArgs,
  zoomEmittedRef: MutableRefObject<MapRecorte | null>,
) {
  useEffect(() => {
    args.engine?.onMapClick((clicked) =>
      handleMapClick(clicked, args, zoomEmittedRef),
    );
  }, [args, zoomEmittedRef]);
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
  const recorte = useStableRecorte(args.recorte);
  const zoomEmittedRef = useRef<MapRecorte | null>(null);
  const { onRecorteChange } = args;

  useSourcesAndPaint(args, sources, recorte);
  useRecorteFraming(args, sources, recorte, zoomEmittedRef);
  useMapClicks(args, zoomEmittedRef);

  return useCallback(
    (recorte: MapRecorte) => {
      zoomEmittedRef.current = recorte;
      onRecorteChange(recorte);
    },
    [onRecorteChange],
  );
}
