"use client";
import { useState } from "react";
import {
  findPibRecord,
  getPibRanking,
  getPibSeries,
  getPibYearOverYear,
  getVabShares,
  type PibMetric,
  type PibPanel,
} from "@/features/panels/pibPanel";
import {
  formatCompactBrl,
  formatSignedPercent,
  formatWholeBrl,
} from "@/features/panels/pibFormat";
import {
  PibRankingChart,
  PibTrendChart,
  VabSharesList,
} from "@/components/PibMobilePanel/PibCharts";

const METRIC_OPTIONS: { value: PibMetric; label: string }[] = [
  { value: "pibTotal", label: "PIB total" },
  { value: "pibPerCapita", label: "PIB per capita" },
];

const METRIC_FORMATTERS: { [metric in PibMetric]: (value: number) => string } =
  {
    pibTotal: formatCompactBrl,
    pibPerCapita: formatWholeBrl,
  };

/**
 * Native mobile version of the Power BI PIB panel: same indicators, as tappable
 * charts. Example: `<PibMobilePanel panel={await fetchPibPanel(...)} />`.
 */
const PibMobilePanel = ({ panel }: { panel: PibPanel }) => {
  const latestYear = panel.years.at(-1) ?? 0;
  const [year, setYear] = useState(latestYear);
  const [uf, setUf] = useState(
    () =>
      getPibRanking(panel, latestYear, "pibTotal")[0]?.uf ?? panel.ufs[0] ?? "",
  );
  const [metric, setMetric] = useState<PibMetric>("pibTotal");

  return (
    <div className="flex w-full flex-col gap-6 bg-white p-4">
      <PibFilters
        panel={panel}
        uf={uf}
        year={year}
        onUfChange={setUf}
        onYearChange={setYear}
      />
      <PibHighlights panel={panel} uf={uf} year={year} />
      <PanelCard
        title={`Evolução do PIB · ${uf}`}
        hint="Toque em um ano para selecioná-lo."
      >
        <PibTrendChart
          series={getPibSeries(panel, uf)}
          selectedYear={year}
          onSelectYear={setYear}
        />
      </PanelCard>
      <PibRankingCard
        panel={panel}
        uf={uf}
        year={year}
        metric={metric}
        onMetricChange={setMetric}
        onSelectUf={setUf}
      />
      <PanelCard title={`Valor adicionado por setor · ${uf} · ${year}`}>
        <VabSharesList shares={getVabSharesFor(panel, uf, year)} />
      </PanelCard>
      <PibSeriesTable panel={panel} uf={uf} />
      <p className="text-xs text-[#5b5b5b]">Fonte: {panel.source}.</p>
    </div>
  );
};

const getVabSharesFor = (panel: PibPanel, uf: string, year: number) => {
  const record = findPibRecord(panel, uf, year);

  return record ? getVabShares(record) : [];
};

const PibFilters = ({
  panel,
  uf,
  year,
  onUfChange,
  onYearChange,
}: {
  panel: PibPanel;
  uf: string;
  year: number;
  onUfChange: (uf: string) => void;
  onYearChange: (year: number) => void;
}) => (
  <div className="sticky top-0 z-10 grid grid-cols-2 gap-3 bg-white py-2">
    <FilterSelect
      label="Estado"
      value={uf}
      options={panel.ufs.map(String)}
      onChange={onUfChange}
    />
    <FilterSelect
      label="Ano"
      value={String(year)}
      options={[...panel.years].reverse().map(String)}
      onChange={(value) => onYearChange(Number(value))}
    />
  </div>
);

const FilterSelect = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) => (
  <label className="flex flex-col gap-1 text-sm font-medium text-[#292829]">
    {label}
    <select
      className="h-10 rounded-md border border-[#d0d0d0] bg-white px-3 text-base"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
);

const PibHighlights = ({
  panel,
  uf,
  year,
}: {
  panel: PibPanel;
  uf: string;
  year: number;
}) => {
  const record = findPibRecord(panel, uf, year);

  return (
    <dl className="grid grid-cols-2 gap-3">
      <StatTile
        label={`PIB ${year}`}
        value={formatCompactBrl(record?.pibTotal ?? null)}
      />
      <StatTile
        label="PIB per capita"
        value={formatWholeBrl(record?.pibPerCapita ?? null)}
      />
      <StatTile
        className="col-span-2"
        label={`Variação sobre ${year - 1}`}
        value={formatSignedPercent(getPibYearOverYear(panel, uf, year))}
      />
    </dl>
  );
};

const StatTile = ({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) => (
  <div
    className={`flex flex-col gap-1 rounded-md bg-[#f5f7f5] p-3 ${className}`}
  >
    <dt className="text-xs font-medium text-[#5b5b5b]">{label}</dt>
    <dd className="text-xl font-semibold text-[#292829]">{value}</dd>
  </div>
);

const PibRankingCard = ({
  panel,
  uf,
  year,
  metric,
  onMetricChange,
  onSelectUf,
}: {
  panel: PibPanel;
  uf: string;
  year: number;
  metric: PibMetric;
  onMetricChange: (metric: PibMetric) => void;
  onSelectUf: (uf: string) => void;
}) => (
  <PanelCard
    title={`Ranking dos estados · ${year}`}
    hint="Toque em uma barra para ver o estado."
  >
    <div className="flex gap-2" role="group" aria-label="Indicador do ranking">
      {METRIC_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={metric === option.value}
          onClick={() => onMetricChange(option.value)}
          className="h-9 rounded-full border border-green-800 px-4 text-sm font-medium text-green-900 aria-pressed:bg-green-800 aria-pressed:text-white"
        >
          {option.label}
        </button>
      ))}
    </div>
    <PibRankingChart
      ranking={getPibRanking(panel, year, metric)}
      selectedUf={uf}
      valueFormatter={METRIC_FORMATTERS[metric]}
      onSelectUf={onSelectUf}
    />
  </PanelCard>
);

/** Table view of the trend chart, so the numbers never depend on the chart alone. */
const PibSeriesTable = ({ panel, uf }: { panel: PibPanel; uf: string }) => (
  <details className="rounded-md border border-[#e3e3e3] p-3">
    <summary className="cursor-pointer text-sm font-medium text-green-900">
      Ver dados em tabela · {uf}
    </summary>
    <table className="mt-3 w-full text-left text-sm">
      <thead>
        <tr className="text-[#5b5b5b]">
          <th className="py-1 font-medium">Ano</th>
          <th className="py-1 font-medium">PIB</th>
          <th className="py-1 font-medium">Per capita</th>
        </tr>
      </thead>
      <tbody>
        {getPibSeries(panel, uf).map((point) => (
          <tr key={point.ano} className="border-t border-[#efefef]">
            <td className="py-1">{point.ano}</td>
            <td className="py-1">{formatCompactBrl(point.pibTotal)}</td>
            <td className="py-1">{formatWholeBrl(point.pibPerCapita)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </details>
);

const PanelCard = ({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <section className="flex flex-col gap-3">
    <div>
      <h3 className="text-lg font-semibold text-[#292829]">{title}</h3>
      {hint && <p className="text-xs text-[#5b5b5b]">{hint}</p>}
    </div>
    {children}
  </section>
);

export default PibMobilePanel;
