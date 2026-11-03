"use client";

import { useCallback } from "react";
import { EChart } from "@/components/EChart/EChart";
import {
  buildPyramidOption,
  type PyramidConfig,
} from "@/features/panels/chartOptions";

export const PyramidChart = ({
  label,
  className = "h-80 w-full",
  onHoverFaixa,
  ...config
}: PyramidConfig & {
  label: string;
  className?: string;
  onHoverFaixa?: (index: number | null) => void;
}) => {
  const { categories, left, right, formatValue, formatShort, activeIndex } =
    config;
  const buildOption = useCallback(
    (width: number) =>
      buildPyramidOption(
        { categories, left, right, formatValue, formatShort, activeIndex },
        width,
      ),
    [categories, left, right, formatValue, formatShort, activeIndex],
  );

  return (
    <EChart
      buildOption={buildOption}
      label={label}
      className={className}
      onCategoryHover={onHoverFaixa}
    />
  );
};
