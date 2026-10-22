"use client";

import { useCallback } from "react";
import { EChart } from "@/components/EChart/EChart";
import {
  buildHorizontalBarOption,
  type ChartPoint,
  type ValueFormatter,
} from "@/features/panels/chartOptions";

export const HorizontalBarChart = ({
  points,
  formatValue,
  label,
  color,
}: {
  points: ChartPoint[];
  formatValue: ValueFormatter;
  label: string;
  color?: string;
}) => {
  const buildOption = useCallback(
    (width: number) =>
      buildHorizontalBarOption(points, formatValue, width, color),
    [points, formatValue, color],
  );

  return (
    <EChart
      buildOption={buildOption}
      label={label}
      className="h-64 w-full sm:h-72"
    />
  );
};
