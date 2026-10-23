"use client";

import { useCallback } from "react";
import { EChart } from "@/components/EChart/EChart";
import {
  buildPieOption,
  type PieSlice,
  type ValueFormatter,
} from "@/features/panels/chartOptions";

export const PieChart = ({
  slices,
  formatValue,
  label,
}: {
  slices: PieSlice[];
  formatValue: ValueFormatter;
  label: string;
}) => {
  const buildOption = useCallback(
    () => buildPieOption(slices, formatValue),
    [slices, formatValue],
  );

  return (
    <EChart buildOption={buildOption} label={label} className="h-80 w-full" />
  );
};
