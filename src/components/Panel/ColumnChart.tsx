"use client";

import { useCallback } from "react";
import { EChart } from "@/components/EChart/EChart";
import {
  buildColumnOption,
  type ColumnConfig,
  type ColumnSeries,
} from "@/features/panels/chartOptions";

// Largura mínima por categoria; abaixo disso o gráfico rola na horizontal.
const SLOT_PER_BAR = 34;
const SLOT_GAP = 24;

// Legenda em HTML, fora da área que rola: no celular a do ECharts ficava no
// meio do gráfico largo, fora da tela.
const ColumnLegend = ({ series }: { series: ColumnSeries[] }) => (
  <ul className="flex flex-wrap justify-center gap-x-2 gap-y-1 py-1">
    {series.map((item) => (
      <li
        key={item.name}
        className="flex items-center gap-1.5 text-xs font-semibold text-grey-1100"
      >
        <span
          aria-hidden
          className="size-3.5 rounded-full"
          style={{ backgroundColor: item.color }}
        />
        {item.name}
      </li>
    ))}
  </ul>
);

export const ColumnChart = ({
  label,
  fit = false,
  ...config
}: ColumnConfig & { label: string; fit?: boolean }) => {
  const { categories, series, formatLabel, formatValue } = config;
  const buildOption = useCallback(() => {
    const option = buildColumnOption({
      categories,
      series,
      formatLabel,
      formatValue,
    });

    return {
      ...option,
      legend: { show: false },
      grid: { ...(option.grid as object), bottom: 8 },
    };
  }, [categories, series, formatLabel, formatValue]);
  const width = categories.length * (series.length * SLOT_PER_BAR + SLOT_GAP);

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <EChart
          buildOption={buildOption}
          label={label}
          className={fit ? "mx-auto h-64" : "h-64 w-full sm:h-72"}
          style={fit ? { width } : { minWidth: width }}
        />
      </div>
      {series.length > 1 ? <ColumnLegend series={series} /> : null}
    </div>
  );
};
