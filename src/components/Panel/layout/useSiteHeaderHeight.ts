"use client";

import { useEffect, useState } from "react";

/**
 * Altura do cabeçalho do site (sticky): o que gruda no topo do painel fica
 * logo abaixo dele, e não por baixo.
 *
 * @example const top = useSiteHeaderHeight(); <div style={{ top }} className="sticky" />
 */
export const useSiteHeaderHeight = () => {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const header = document.querySelector("header");

    if (!header) return;
    const observer = new ResizeObserver(() => setHeight(header.offsetHeight));

    observer.observe(header);

    return () => observer.disconnect();
  }, []);

  return height;
};
