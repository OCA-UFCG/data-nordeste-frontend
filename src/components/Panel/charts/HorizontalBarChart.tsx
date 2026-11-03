"use client";

import { useCallback } from "react";
import { EChart } from "@/components/EChart/EChart";
import {
  buildHorizontalBarOption,
  type BarPoint,
  type ValueFormatter,
} from "@/features/panels/chartOptions";

export const HorizontalBarChart = ({
  points,
  formatValue,
  label,
  color,
  className = "h-64 w-full sm:h-72",
}: {
  points: BarPoint[];
  formatValue: ValueFormatter;
  label: string;
  color?: string;
  className?: string;
}) => {
  const buildOption = useCallback(
    (width: number) =>
      buildHorizontalBarOption(points, formatValue, width, color),
    [points, formatValue, color],
  );

  return (
    <EChart buildOption={buildOption} label={label} className={className} />
  );
};
