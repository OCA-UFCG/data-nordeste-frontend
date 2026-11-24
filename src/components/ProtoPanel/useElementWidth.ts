"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Largura (e altura) de um elemento, medida de novo a cada mudança de tamanho. Os
 * gráficos SVG desenham em pixels, então precisam dela antes de montar a
 * geometria; no primeiro render a largura é 0.
 *
 * @example const { ref, width } = useElementWidth(); <div ref={ref}>{width ? <Svg width={width} /> : null}</div>
 */
export const useElementWidth = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;
    const observer = new ResizeObserver(() => {
      setWidth(element.clientWidth);
      setHeight(element.clientHeight);
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return { ref, width, height };
};
