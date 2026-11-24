"use client";

import { type MutableRefObject, useEffect, useRef } from "react";

import {
  type MapLevel,
  type MapRecorte,
  resolveRecorte,
  sameRecorte,
} from "@/features/panelMap/mapRecorte";
import type { PanelMapEngine, PanelMapMoveEnd } from "@/lib/panelMapEngine";

export type UseMapRecorteArgs = {
  engine: PanelMapEngine | null;
  recorte: MapRecorte;
  deepest: MapLevel;
  onRecorteChange: (recorte: MapRecorte) => void;
};

type MoveContext = Omit<UseMapRecorteArgs, "engine"> & {
  anchorZoomRef: MutableRefObject<number | null>;
};

// IMPORTANT: a âncora é o zoom de referência para "afastou o bastante para
// subir de nível". Depois de um fit é o zoom do fit; depois de um recorte que o
// próprio usuário escolheu é o zoom em que ele o escolheu. Sem isso, quem
// aproximou até um estado só o limparia afastando abaixo do fit antigo da área.
// WARNING: só `fit` troca a âncora. Um resize do container também é
// programático, mas traz o `fittedZoom` do fit antigo e apagaria a âncora.
function handleMoveEnd(move: PanelMapMoveEnd, context: MoveContext): void {
  const { anchorZoomRef, recorte, deepest, onRecorteChange } = context;

  if (move.fit) anchorZoomRef.current = move.fittedZoom;
  if (move.programmatic) return;
  const next = resolveRecorte({
    ...move,
    fittedZoom: anchorZoomRef.current ?? move.fittedZoom,
    current: recorte,
    deepest,
  });

  if (sameRecorte(next, recorte)) return;
  anchorZoomRef.current = move.zoom;
  onRecorteChange(next);
}

/**
 * Transforma o zoom/arraste do usuário no recorte do painel: no fim de cada
 * gesto resolve o recorte pelo zoom e pelo centro e chama `onRecorteChange` só
 * quando ele muda. Movimento programático (fitTo, resize) nunca gera filtro.
 *
 * @example useMapRecorte({ engine, recorte, deepest: "municipio", onRecorteChange: setRecorte });
 */
export function useMapRecorte({ engine, ...args }: UseMapRecorteArgs): void {
  const anchorZoomRef = useRef<number | null>(null);
  const { recorte, deepest, onRecorteChange } = args;

  // Registrar de novo substitui o callback anterior no motor (um por vez).
  useEffect(() => {
    engine?.onMoveEnd((move) =>
      handleMoveEnd(move, { recorte, deepest, onRecorteChange, anchorZoomRef }),
    );
  }, [engine, recorte, deepest, onRecorteChange]);
}
