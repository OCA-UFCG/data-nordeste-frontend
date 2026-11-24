"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSiteHeaderHeight } from "@/components/Panel/layout/useSiteHeaderHeight";

/**
 * Rolagem programática do painel: suave, menos com `prefers-reduced-motion`
 * (no protótipo, `html{scroll-behavior:smooth}` some com a preferência).
 *
 * @example window.scrollTo({ top: 0, behavior: protoScrollBehavior() });
 */
export const protoScrollBehavior = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";

const useMeasure = (measure: () => void) => {
  useEffect(() => {
    const observer = new ResizeObserver(measure);

    observer.observe(document.body);
    window.addEventListener("scroll", measure, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", measure);
    };
  }, [measure]);
};

/**
 * Gruda a barra de filtros logo abaixo do cabeçalho do site, como no
 * protótipo. `stuck` liga a sombra da barra quando ela gruda.
 *
 * @example const sticky = useProtoSticky(); <ProtoFilterBar barRef={sticky.filterRef} top={sticky.filterTop} stuck={sticky.stuck} />
 */
export const useProtoSticky = () => {
  const header = useSiteHeaderHeight();
  const filterRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState({ filter: 88, stuck: false });
  const measure = useCallback(() => {
    const filter = filterRef.current;

    const next = {
      filter: filter?.offsetHeight ?? 88,
      stuck: !!filter && filter.getBoundingClientRect().top <= header + 1,
    };

    // PERF: roda a cada rolagem; só renderiza de novo quando algo mudou.
    setSizes((current) =>
      current.filter === next.filter && current.stuck === next.stuck
        ? current
        : next,
    );
  }, [header]);

  useMeasure(measure);

  // Ao trocar de visão já rolado para baixo, volta ao topo do conteúdo, logo
  // abaixo do que está grudado.
  const reveal = (layout: HTMLElement | null) => {
    if (!layout) return;
    const top =
      layout.getBoundingClientRect().top +
      window.scrollY -
      header -
      sizes.filter;

    if (window.scrollY > top)
      window.scrollTo({
        top: Math.max(0, top),
        behavior: protoScrollBehavior(),
      });
  };

  return {
    filterRef,
    filterTop: header,
    stuck: sizes.stuck,
    reveal,
  };
};
