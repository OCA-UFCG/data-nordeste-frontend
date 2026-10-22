"use client";

import { useCallback } from "react";
import { EChart } from "@/components/EChart/EChart";
import {
  buildColumnOption,
  type ColumnConfig,
} from "@/features/panels/chartOptions";

// Largura mínima por categoria; abaixo disso o gráfico rola na horizontal.
const SLOT_PER_BAR = 34;
const SLOT_GAP = 24;

export const ColumnChart = ({
  label,
  ...config
}: ColumnConfig & { label: string }) => {
  const { categories, series, formatLabel, formatValue } = config;
  const buildOption = useCallback(
    () => buildColumnOption({ categories, series, formatLabel, formatValue }),
    [categories, series, formatLabel, formatValue],
  );
  const minWidth =
    categories.length * (series.length * SLOT_PER_BAR + SLOT_GAP);

  return (
    <div className="overflow-x-auto">
      <EChart
        buildOption={buildOption}
        label={label}
        className="h-72 w-full sm:h-80"
        style={{ minWidth }}
      />
    </div>
  );
};
