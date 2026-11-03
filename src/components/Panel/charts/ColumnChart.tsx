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

type AxisCustom = { rotateLabels: boolean; axisName?: string };

// Inclinados como no Power BI: todas as categorias aparecem mesmo no card estreito.
const customAxis = (
  xAxis: { axisLabel: object },
  { rotateLabels, axisName }: AxisCustom,
) => ({
  ...xAxis,
  ...(rotateLabels
    ? { axisLabel: { ...xAxis.axisLabel, interval: 0, rotate: 35 } }
    : {}),
  ...(axisName
    ? {
        name: axisName,
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: { fontSize: 12 },
      }
    : {}),
});

export const ColumnChart = ({
  label,
  fit = false,
  grow = false,
  rotateLabels = false,
  axisName,
  onSelectLabel,
  ...config
}: ColumnConfig & {
  label: string;
  fit?: boolean;

  // Cresce até a altura do card, quando o vizinho da linha é mais alto.
  grow?: boolean;
  rotateLabels?: boolean;
  axisName?: string;
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
      grid: { ...(option.grid as object), bottom: axisName ? 28 : 8 },
      ...(rotateLabels || axisName
        ? {
            xAxis: customAxis(option.xAxis as { axisLabel: object }, {
              rotateLabels,
              axisName,
            }),
          }
        : {}),
    };
  }, [categories, series, formatLabel, formatValue, rotateLabels, axisName]);
  const width = categories.length * (series.length * SLOT_PER_BAR + SLOT_GAP);

  return (
    <div className={`flex flex-col gap-4 ${grow ? "flex-1" : ""}`}>
      <div className={`overflow-x-auto ${grow ? "flex flex-1" : ""}`}>
        <EChart
          buildOption={buildOption}
          label={label}
          onCategoryClick={onSelectLabel ? selectColumn : undefined}
          className={
            fit
              ? "mx-auto h-64"
              : grow
                ? "min-h-64 w-full flex-1 sm:min-h-72"
                : "h-64 w-full sm:h-72"
          }
          style={fit ? { width } : { minWidth: width }}
        />
      </div>
      {series.length > 1 ? <ColumnLegend series={series} /> : null}
    </div>
  );
};
