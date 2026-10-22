"use client";

import { useCallback } from "react";
import { EChart } from "@/components/EChart/EChart";
import {
  buildPyramidOption,
  type PyramidConfig,
} from "@/features/panels/chartOptions";

export const PyramidChart = ({
  label,
  ...config
}: PyramidConfig & { label: string }) => {
  const { categories, left, right, formatValue, formatAxis } = config;
  const buildOption = useCallback(
    (width: number) =>
      buildPyramidOption(
        { categories, left, right, formatValue, formatAxis },
        width,
      ),
    [categories, left, right, formatValue, formatAxis],
  );

  return (
    <EChart buildOption={buildOption} label={label} className="h-80 w-full" />
  );
};
