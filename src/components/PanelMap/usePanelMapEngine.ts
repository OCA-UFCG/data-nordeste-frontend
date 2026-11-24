"use client";

import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  type BasemapKind,
  createPanelMapEngine,
  type PanelMapEngine,
} from "@/lib/panelMapEngine";

export const DEFAULT_BASEMAP: BasemapKind = "oceano";

export type PanelMapEngineMount = {
  municipal: boolean;
  cooperative: boolean;
  createEngine?: typeof createPanelMapEngine;
  onEngine?: (engine: PanelMapEngine | null) => void;
};

// `failed`: o MapLibre não carregou ou não criou o mapa (ex.: sem WebGL).
type EngineState = { engine: PanelMapEngine | null; failed: boolean };

const NO_ENGINE: EngineState = { engine: null, failed: false };

// `municipal`, `cooperative` e a fábrica são lidos só aqui, na montagem: valem
// pela vida do componente. `onEngine` é lido pelo ref na hora, para pegar o
// mais recente.
function mountEngine(
  container: HTMLElement,
  mountRef: MutableRefObject<PanelMapEngineMount>,
  setState: Dispatch<SetStateAction<EngineState>>,
): () => void {
  const { municipal, cooperative, createEngine } = mountRef.current;
  const teardown = (createEngine ?? createPanelMapEngine)(container, {
    basemap: DEFAULT_BASEMAP,
    municipal,
    cooperative,
    onReady: (ready) => {
      setState({ engine: ready, failed: false });
      mountRef.current.onEngine?.(ready);
    },
    onError: () => setState({ engine: null, failed: true }),
  });

  return () => {
    teardown();
    mountRef.current.onEngine?.(null);
  };
}

/**
 * Monta o motor do mapa no `containerRef` uma vez por componente e o desmonta
 * ao sair. `onEngine` recebe o motor pronto (e `null` ao desmontar), para o
 * card baixar a imagem do mapa; `failed` diz que o mapa não pôde ser criado.
 *
 * @example const { containerRef, engine, failed } = usePanelMapEngine({ municipal: true, cooperative: true }); <div ref={containerRef} />
 */
export function usePanelMapEngine(mount: PanelMapEngineMount) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<EngineState>(NO_ENGINE);
  const mountRef = useRef(mount);

  useEffect(() => {
    mountRef.current = mount;
  });

  // INTENTIONAL: deps vazias. Callbacks novos do pai não podem recriar o mapa.
  useEffect(() => {
    const container = containerRef.current;

    return container ? mountEngine(container, mountRef, setState) : undefined;
  }, []);

  return { containerRef, ...state };
}
