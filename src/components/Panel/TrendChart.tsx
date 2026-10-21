"use client";

import { useCallback, useId, useState } from "react";
import { EChart } from "@/components/EChart/EChart";
import {
  buildTrendOption,
  type ChartPoint,
  type ValueFormatter,
} from "@/features/panels/chartOptions";

export type TrendMetric = {
  key: string;
  label: string;
  points: ChartPoint[];
  formatLabel: ValueFormatter;
  formatValue: ValueFormatter;
  formatAxis: ValueFormatter;
};

const TrendTabs = ({
  metrics,
  active,
  idPrefix,
  onSelect,
}: {
  metrics: TrendMetric[];
  active: TrendMetric;
  idPrefix: string;
  onSelect: (metric: TrendMetric) => void;
}) => (
  <div role="tablist" aria-label="Indicador" className="flex gap-1">
    {metrics.map((metric) => (
      <button
        key={metric.key}
        type="button"
        role="tab"
        id={`${idPrefix}-tab-${metric.key}`}
        aria-selected={active.key === metric.key}
        aria-controls={`${idPrefix}-panel`}
        onClick={() => onSelect(metric)}
        className="min-h-11 rounded-t-lg px-4 text-base font-semibold text-grey-800 aria-selected:bg-white aria-selected:text-grey-1100 aria-[selected=false]:bg-grey-300"
      >
        {metric.label}
      </button>
    ))}
  </div>
);

export const TrendChart = ({
  title,
  metrics,
  selectedLabel,
}: {
  title: string;
  metrics: TrendMetric[];
  selectedLabel: string;
}) => {
  const idPrefix = useId();
  const [activeKey, setActiveKey] = useState(metrics[0].key);
  const active =
    metrics.find((metric) => metric.key === activeKey) ?? metrics[0];
  const buildOption = useCallback(
    (width: number) =>
      buildTrendOption(
        {
          ...active,
          seriesName: active.label,
          selectedIndex: active.points.findIndex(
            (point) => point.label === selectedLabel,
          ),
        },
        width,
      ),
    [active, selectedLabel],
  );

  return (
    <section className="flex min-w-0 flex-col">
      <h2 className="mb-3 text-lg font-semibold text-grey-1100 sm:text-xl">
        {title}
      </h2>
      <TrendTabs
        metrics={metrics}
        active={active}
        idPrefix={idPrefix}
        onSelect={(metric) => setActiveKey(metric.key)}
      />
      <div
        id={`${idPrefix}-panel`}
        role="tabpanel"
        aria-labelledby={`${idPrefix}-tab-${active.key}`}
        className="min-w-0 rounded-b-lg rounded-tr-lg bg-white p-3 shadow-sm sm:p-4"
      >
        <EChart
          buildOption={buildOption}
          label={`Gráfico de linha: ${active.label}`}
          className="h-72 w-full sm:h-80"
        />
      </div>
    </section>
  );
};
