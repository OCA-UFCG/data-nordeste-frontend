"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import {
  createChart,
  type ChartInstance,
  type ChartOption,
  type ChartRenderer,
} from "@/lib/echarts";

type EChartProps = {
  buildOption: (width: number) => ChartOption;
  label: string;
  className?: string;
  style?: CSSProperties;
  onItemClick?: (name: string) => void;

  // Clique em qualquer ponto da área do grid: recebe o índice da categoria.
  onCategoryClick?: (index: number) => void;
  renderer?: ChartRenderer;

  // false: cada opção nova redesenha do zero (o mapa, que não pode herdar o
  // zoom e o enquadramento da opção anterior).
  morph?: boolean;
};

// Séries e legenda casam pelo id: as que ficam se transformam (barras crescem,
// a linha muda de forma) e as que saíram somem. notMerge mataria a animação.
const MORPH_UPDATE = { replaceMerge: ["series", "legend"] };
const REDRAW_UPDATE = { notMerge: true };

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const WIDTH_STEP = 40;

const useChartInstance = (renderer?: ChartRenderer) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<ChartInstance | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) return;
    const instance = createChart(element, renderer);
    const observer = new ResizeObserver(([entry]) => {
      instance.resize();
      setWidth(Math.round(entry.contentRect.width / WIDTH_STEP) * WIDTH_STEP);
    });

    observer.observe(element);
    setChart(instance);

    return () => {
      observer.disconnect();
      instance.dispose();
    };
  }, [renderer]);

  return { containerRef, chart, width };
};

const usePageFont = (containerRef: RefObject<HTMLDivElement | null>) => {
  const [fontFamily, setFontFamily] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    document.fonts.ready.then(() => {
      const element = containerRef.current;

      if (active && element) {
        setFontFamily(getComputedStyle(element).fontFamily);
      }
    });

    return () => {
      active = false;
    };
  }, [containerRef]);

  return fontFamily;
};

type ZrPointer = { offsetX: number; offsetY: number };

// O alvo deixa de ser só a bolinha (8 px, pequena para o dedo) e passa a ser a
// coluna inteira da categoria. Fora do grid (eixos, margens) não faz nada.
const useCategoryClick = (
  chart: ChartInstance | null,
  onCategoryClick?: (index: number) => void,
) => {
  useEffect(() => {
    if (!chart || !onCategoryClick) return;
    const zr = chart.getZr();
    const handleGridClick = ({ offsetX, offsetY }: ZrPointer) => {
      if (!chart.containPixel({ gridIndex: 0 }, [offsetX, offsetY])) return;
      onCategoryClick(chart.convertFromPixel({ xAxisIndex: 0 }, offsetX));
    };

    zr.on("click", handleGridClick);

    return () => {
      zr.off("click", handleGridClick);
    };
  }, [chart, onCategoryClick]);
};

export const EChart = ({
  buildOption,
  label,
  className,
  style,
  onItemClick,
  onCategoryClick,
  renderer,
  morph = true,
}: EChartProps) => {
  const { containerRef, chart, width } = useChartInstance(renderer);

  const fontFamily = usePageFont(containerRef);

  useEffect(() => {
    if (!chart || width === 0 || !fontFamily) return;
    const option = buildOption(width);
    const textStyle = { ...(option.textStyle as object), fontFamily };
    const motion = prefersReducedMotion() ? { animation: false } : {};

    chart.setOption(
      { ...option, textStyle, ...motion },
      morph ? MORPH_UPDATE : REDRAW_UPDATE,
    );
  }, [chart, buildOption, width, fontFamily, morph]);

  useEffect(() => {
    if (!chart || !onItemClick) return;
    const handleClick = (params: { name?: string }) => {
      if (params.name) onItemClick(params.name);
    };

    chart.on("click", handleClick);

    return () => {
      chart.off("click", handleClick);
    };
  }, [chart, onItemClick]);

  useCategoryClick(chart, onCategoryClick);

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
      role="img"
      aria-label={label}
    />
  );
};
