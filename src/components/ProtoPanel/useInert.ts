"use client";

import { useEffect, useRef } from "react";

/**
 * Deixa o elemento inerte (sem foco nem clique) enquanto `inert` for verdadeiro.
 * O app roda no React 19 que o Next embute (`inert` booleano, `""` vira false)
 * e os testes no React 18 (sem suporte a `inert`, reclama de `inert=""` no
 * JSX). Ligado direto no DOM, por um efeito, o atributo vale nos dois sem aviso.
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
