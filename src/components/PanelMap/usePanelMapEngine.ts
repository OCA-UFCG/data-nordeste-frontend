"use client";

import { useEffect, useRef, useState } from "react";

import {
  type BasemapKind,
  createPanelMapEngine,
  type PanelMapEngine,
} from "@/lib/panelMapEngine";

export const DEFAULT_BASEMAP: BasemapKind = "oceano";

export type PanelMapEngineMount = {
  municipal: boolean;
  createEngine?: typeof createPanelMapEngine;
  onEngine?: (engine: PanelMapEngine | null) => void;
};

/**
 * Monta o motor do mapa no `containerRef` uma vez por componente e o desmonta
 * ao sair. `onEngine` recebe o motor pronto (e `null` ao desmontar), para o
 * card baixar a imagem do mapa.
 *
 * @example const { containerRef, engine } = usePanelMapEngine({ municipal: true }); <div ref={containerRef} />
 */
export function usePanelMapEngine(mount: PanelMapEngineMount) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<PanelMapEngine | null>(null);
  const onEngineRef = useRef(mount.onEngine);
  const createRef = useRef(mount.createEngine ?? createPanelMapEngine);
  const municipalRef = useRef(mount.municipal);

  useEffect(() => {
    onEngineRef.current = mount.onEngine;
  }, [mount.onEngine]);

  // INTENTIONAL: deps vazias. `municipal` e a fábrica valem pela vida do
  // componente; callbacks novos do pai não podem recriar o mapa.
  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;
    const teardown = createRef.current(container, {
      basemap: DEFAULT_BASEMAP,
      municipal: municipalRef.current,
      onReady: (ready) => {
        setEngine(ready);
        onEngineRef.current?.(ready);
      },
    });

    return () => {
      teardown();
      onEngineRef.current?.(null);
    };
  }, []);

  return { containerRef, engine };
}
