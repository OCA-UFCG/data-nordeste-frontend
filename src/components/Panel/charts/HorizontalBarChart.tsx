"use client";

import { useCallback } from "react";
import { EChart } from "@/components/EChart/EChart";
import {
  buildHorizontalBarOption,
  FOCUS_BAR,
  type BarPoint,
  type ValueFormatter,
} from "@/features/panels/chartOptions";

export const HorizontalBarChart = ({
  points,
  formatValue,
  label,
  color,
  className = "h-64 w-full sm:h-72",
  fadeOthers = false,
  labelRoom,
}: {
  points: BarPoint[];
  formatValue: ValueFormatter;
  label: string;
  color?: string;
  className?: string;

  // A barra apontada fica em cor cheia e as outras esmaecem; sem balão, que
  // cobria a barra vizinha: o valor fica só no rótulo.
  fadeOthers?: boolean;
  labelRoom?: number;
}) => {
  const buildOption = useCallback(
    (width: number) => {
      const option = buildHorizontalBarOption(
        points,
        formatValue,
        width,
        color,
      );

      const grid = labelRoom
        ? { grid: { ...(option.grid as object), right: labelRoom } }
        : {};

      if (!fadeOthers) return { ...option, ...grid };
      const [series] = option.series as object[];

      return {
        ...option,
        ...grid,
        tooltip: { show: false },
        series: [{ ...series, ...FOCUS_BAR }],
      };
    },
    [points, formatValue, color, fadeOthers, labelRoom],
  );

  return (
    <EChart buildOption={buildOption} label={label} className={className} />
  );
};
