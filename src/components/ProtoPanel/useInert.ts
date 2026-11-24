"use client";

import { useEffect, useRef } from "react";

/**
 * Deixa o elemento inerte (sem foco nem clique) enquanto `inert` for verdadeiro.
 * O React 18 não tem suporte a `inert` e reclama de `inert=""` no JSX, então o
 * atributo é ligado direto no DOM, por um efeito.
 *
 * @example const ref = useInert(loading); <div ref={ref} />
 */
export const useInert = <T extends HTMLElement>(inert: boolean) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    ref.current?.toggleAttribute("inert", inert);
  }, [inert]);

  return ref;
};
