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
} from "@/lib/echarts";

type EChartProps = {
  buildOption: (width: number) => ChartOption;
  label: string;
  className?: string;
  style?: CSSProperties;
  onItemClick?: (name: string) => void;
};

const WIDTH_STEP = 40;

const useChartInstance = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<ChartInstance | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) return;
    const instance = createChart(element);
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
  }, []);

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

export const EChart = ({
  buildOption,
  label,
  className,
  style,
  onItemClick,
}: EChartProps) => {
  const { containerRef, chart, width } = useChartInstance();

  const fontFamily = usePageFont(containerRef);

  useEffect(() => {
    if (!chart || width === 0 || !fontFamily) return;
    const option = buildOption(width);
    const textStyle = { ...(option.textStyle as object), fontFamily };

    chart.setOption({ ...option, textStyle }, { notMerge: true });
  }, [chart, buildOption, width, fontFamily]);

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
