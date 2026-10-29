"use client";

import { useCallback, useId, useState } from "react";
import { EChart } from "@/components/EChart/EChart";
import { TableToggle } from "@/components/Panel/ChartCard";
import { DataTable } from "@/components/Panel/DataTable";
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
  <div role="tablist" aria-label="Indicador" className="flex min-w-0 gap-1">
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

// No celular os pontos ficam sem rótulo; o valor do ano escolhido aparece aqui.
const SelectedValue = ({
  metric,
  label,
  canSelect,
}: {
  metric: TrendMetric;
  label: string;
  canSelect: boolean;
}) => {
  const point = metric.points.find((item) => item.label === label);

  if (!point) return null;

  return (
    <div aria-live="polite" className="px-1 pb-1 sm:hidden">
      <p className="text-base text-grey-1100">
        Em {label}:{" "}
        <strong className="text-lg">{metric.formatValue(point.value)}</strong>
      </p>
      {canSelect ? (
        <p className="text-sm text-grey-800">
          Toque num ponto para ver outro ano.
        </p>
      ) : null}
    </div>
  );
};

export const TrendChart = ({
  title,
  metrics,
  selectedLabel,
  onSelectLabel,
}: {
  title?: string; // Sem título, as abas fazem esse papel (como no Power BI do PIB).
  metrics: TrendMetric[];
  selectedLabel: string;

  // Clique num ponto: recebe o rótulo da categoria (ex.: o ano).
  onSelectLabel?: (label: string) => void;
}) => {
  const idPrefix = useId();
  const [activeKey, setActiveKey] = useState(metrics[0].key);
  const [showTable, setShowTable] = useState(false);
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
      {title ? (
        <h2 className="mb-3 text-lg font-semibold text-grey-1100 sm:text-xl">
          {title}
        </h2>
      ) : null}
      <div className="flex items-end justify-between gap-2">
        <TrendTabs
          metrics={metrics}
          active={active}
          idPrefix={idPrefix}
          onSelect={(metric) => setActiveKey(metric.key)}
        />
        <TableToggle
          showTable={showTable}
          onToggle={() => setShowTable((value) => !value)}
        />
      </div>
      <div
        id={`${idPrefix}-panel`}
        role="tabpanel"
        aria-labelledby={`${idPrefix}-tab-${active.key}`}
        className="min-w-0 rounded-b-lg rounded-tr-lg bg-white p-3 shadow-sm sm:p-4"
      >
        {showTable ? (
          <DataTable
            content={{
              caption: active.label,
              columns: ["Ano", active.label.replace(/^Evolução anual do /, "")],
              rows: active.points.map((point) => [
                point.label,
                active.formatValue(point.value),
              ]),
            }}
            className="h-72 sm:h-80"
          />
        ) : (
          <>
            <SelectedValue
              metric={active}
              label={selectedLabel}
              canSelect={Boolean(onSelectLabel)}
            />
            <EChart
              buildOption={buildOption}
              label={`Gráfico de linha: ${active.label}`}
              onItemClick={onSelectLabel}
              className="h-72 w-full sm:h-80"
            />
          </>
        )}
      </div>
    </section>
  );
};
