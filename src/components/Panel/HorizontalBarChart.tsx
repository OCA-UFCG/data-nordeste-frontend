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
}: {
  points: ChartPoint[];
  formatValue: ValueFormatter;
  label: string;
}) => {
  const buildOption = useCallback(
    (width: number) => buildHorizontalBarOption(points, formatValue, width),
    [points, formatValue],
  );

  return (
    <EChart
      buildOption={buildOption}
      label={label}
      className="h-64 w-full sm:h-72"
    />
  );
};
