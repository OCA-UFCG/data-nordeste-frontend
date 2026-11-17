"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSiteHeaderHeight } from "@/components/Panel/layout/useSiteHeaderHeight";

// Altura de um elemento que está grudado; zero se ele está oculto ou estático
// (a barra de abas só gruda entre 701 e 900 px).
const stickyHeight = (element: HTMLElement | null) => {
  if (!element || !element.offsetParent) return 0;

  return getComputedStyle(element).position === "sticky"
    ? element.offsetHeight
    : 0;
};

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
 * Encadeia o que gruda no topo, como no protótipo: cabeçalho do site, barra de
 * abas (até 900 px), barra de filtros e a coluna lateral 16 px abaixo dela.
 * `stuck` liga a sombra da barra de filtros quando ela gruda.
 *
 * @example const sticky = useProtoSticky(); <ProtoFilterBar barRef={sticky.filterRef} top={sticky.filterTop} stuck={sticky.stuck} />
 */
export const useProtoSticky = () => {
  const header = useSiteHeaderHeight();
  const tabsRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState({ tabs: 0, filter: 88, stuck: false });
  const measure = useCallback(() => {
    const tabs = stickyHeight(tabsRef.current);
    const filter = filterRef.current;

    const next = {
      tabs,
      filter: filter?.offsetHeight ?? 88,
      stuck:
        !!filter && filter.getBoundingClientRect().top <= header + tabs + 1,
    };

    // PERF: roda a cada rolagem; só renderiza de novo quando algo mudou.
    setSizes((current) =>
      current.tabs === next.tabs &&
      current.filter === next.filter &&
      current.stuck === next.stuck
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
      sizes.tabs -
      sizes.filter;

    if (window.scrollY > top)
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  };

  return {
    tabsRef,
    filterRef,
    tabsTop: header,
    filterTop: header + sizes.tabs,
    railTop: header + sizes.tabs + sizes.filter + 16,
    stuck: sizes.stuck,
    reveal,
  };
};
