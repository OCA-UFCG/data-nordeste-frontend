"use client";

import { useCallback } from "react";
import { EChart } from "@/components/EChart/EChart";
import type { ColumnConfig } from "@/features/panels/chartOptions";
import { buildLineOption } from "@/features/panels/lineOption";

export const LineChart = ({
  label,
  className = "h-72 w-full sm:h-80",
  selectedLabel,
  onSelectLabel,
  ...config
}: ColumnConfig & {
  label: string;
  className?: string;
  selectedLabel?: string;
  onSelectLabel?: (label: string) => void;
}) => {
  const { categories, series, formatLabel, formatValue } = config;
  const buildOption = useCallback(
    (width: number) =>
      buildLineOption(
        {
          categories,
          series,
          formatLabel,
          formatValue,
          selectedIndex: selectedLabel ? categories.indexOf(selectedLabel) : -1,
        },
        width,
      ),
    [categories, series, formatLabel, formatValue, selectedLabel],
  );
  const selectCategory = useCallback(
    (index: number) => {
      const category = categories[index];

      if (category !== undefined) onSelectLabel?.(category);
    },
    [categories, onSelectLabel],
  );

  return (
    <EChart
      buildOption={buildOption}
      label={label}
      onCategoryClick={onSelectLabel ? selectCategory : undefined}
      className={className}
    />
  );
};
