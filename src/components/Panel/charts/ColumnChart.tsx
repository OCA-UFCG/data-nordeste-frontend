"use client";

import { useCallback } from "react";
import { EChart } from "@/components/EChart/EChart";
import type { DataTableContent } from "@/components/Panel/cards/DataTable";
import {
  buildColumnOption,
  type ColumnConfig,
  type ColumnSeries,
} from "@/features/panels/chartOptions";

// Largura mínima por barra: cabe um rótulo de 5 caracteres ("0,655", "1.140")
// sem encostar no vizinho. Abaixo disso o gráfico rola na horizontal.
const SLOT_PER_BAR = 42;
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

/**
 * "Ver tabela" de um gráfico de colunas: uma linha por categoria e uma coluna
 * por série.
 *
 * @example toColumnTable("IDH por ano", "Ano", config) // { columns: ["Ano", "IDH", ...], ... }
 */
export const toColumnTable = (
  caption: string,
  categoryLabel: string,
  { categories, series, formatValue }: ColumnConfig,
): DataTableContent => ({
  caption,
  columns: [categoryLabel, ...series.map((item) => item.name)],
  rows: categories.map((category, index) => [
    category,
    ...series.map((item) => formatValue(item.values[index])),
  ]),
});

export const ColumnChart = ({
  label,
  fit = false,
  onSelectLabel,
  ...config
}: ColumnConfig & {
  label: string;
  fit?: boolean;
  onSelectLabel?: (label: string) => void;
}) => {
  const { categories, series, formatLabel, formatValue } = config;
  const selectColumn = useCallback(
    (index: number) => {
      const category = categories[index];

      if (category !== undefined) onSelectLabel?.(category);
    },
    [categories, onSelectLabel],
  );
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
          onCategoryClick={onSelectLabel ? selectColumn : undefined}
          className={fit ? "mx-auto h-64" : "h-64 w-full sm:h-72"}
          style={fit ? { width } : { minWidth: width }}
        />
      </div>
      {series.length > 1 ? <ColumnLegend series={series} /> : null}
    </div>
  );
};
