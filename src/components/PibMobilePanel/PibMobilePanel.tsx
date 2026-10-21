"use client";
import { useState, type ReactNode } from "react";
import {
  findPibPoint,
  getActivitiesOfYear,
  getLatestPibYear,
  getSelectionLabel,
  getVabShares,
  resolveBreakdownYear,
  type PibPanel,
} from "@/features/panels/pibPanel";
import { formatCompactBrl, formatWholeBrl } from "@/features/panels/pibFormat";
import PibFilters from "@/components/PibMobilePanel/PibFilters";
import {
  ActivitiesList,
  PibTrendChart,
  VabSharesList,
  type PibTrendMetric,
} from "@/components/PibMobilePanel/PibCharts";
import { usePibPanel } from "@/components/PibMobilePanel/usePibPanel";

const TREND_TABS: { value: PibTrendMetric; label: string }[] = [
  { value: "pibTotal", label: "PIB total" },
  { value: "pibPerCapita", label: "PIB per capita" },
];

/**
 * Mobile version of the Power BI PIB panel, one block under the other in the
 * same order: filters, headline numbers, yearly trend, VAB by sector and main
 * activity. Example: `<PibMobilePanel initialPanel={await fetchPibPanel(...)} />`.
 */
const PibMobilePanel = ({ initialPanel }: { initialPanel: PibPanel }) => {
  const { panel, isLoading, hasError, select } = usePibPanel(initialPanel);
  const [requestedYear, setYear] = useState(
    getLatestPibYear(initialPanel) ?? 0,
  );

  // A new selection may not cover the year picked before; show its latest one.
  const year = findPibPoint(panel, requestedYear)
    ? requestedYear
    : getLatestPibYear(panel) ?? requestedYear;

  return (
    <div className="flex w-full flex-col gap-6 bg-white px-4 pb-6">
      <PibFilters
        panel={panel}
        year={year}
        onYearChange={setYear}
        onSelect={select}
      />
      {hasError && <LoadError />}
      <div
        aria-busy={isLoading}
        className={`flex flex-col gap-8 transition-opacity ${isLoading ? "opacity-50" : ""}`}
      >
        <PibHighlights panel={panel} year={year} />
        <PibTrendSection panel={panel} year={year} onSelectYear={setYear} />
        <VabSection panel={panel} year={year} />
        <ActivitySection panel={panel} year={year} />
        <PibSeriesTable panel={panel} />
        <p className="text-xs text-[#5b5b5b]">Fonte: {panel.source}.</p>
      </div>
    </div>
  );
};

const LoadError = () => (
  <p
    role="alert"
    className="rounded-md bg-orange-100 p-3 text-sm text-orange-800"
  >
    Não foi possível atualizar o painel. Mostrando o último recorte carregado.
  </p>
);

const PibHighlights = ({ panel, year }: { panel: PibPanel; year: number }) => {
  const point = findPibPoint(panel, year);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold text-[#292829]">
        {getSelectionLabel(panel)}
      </h2>
      <dl className="grid grid-cols-2 gap-3">
        <StatTile
          label={`PIB · ${year}`}
          value={formatCompactBrl(point?.pibTotal ?? null)}
        />
        <StatTile
          label={`PIB per capita · ${year}`}
          value={formatWholeBrl(point?.pibPerCapita ?? null)}
        />
      </dl>
    </div>
  );
};

const StatTile = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1 rounded-md border-l-4 border-orange-600 bg-orange-100 p-3">
    <dt className="text-xs font-medium text-[#5b5b5b]">{label}</dt>
    <dd className="text-xl font-semibold text-[#292829]">{value}</dd>
  </div>
);

const PibTrendSection = ({
  panel,
  year,
  onSelectYear,
}: {
  panel: PibPanel;
  year: number;
  onSelectYear: (year: number) => void;
}) => {
  const [metric, setMetric] = useState<PibTrendMetric>("pibTotal");

  return (
    <PanelSection
      title="Evolução anual"
      hint="Toque em um ano para selecioná-lo."
    >
      <div
        className="flex gap-2"
        role="group"
        aria-label="Indicador da evolução anual"
      >
        {TREND_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={metric === tab.value}
            onClick={() => setMetric(tab.value)}
            className="h-9 rounded-full border border-orange-700 px-4 text-sm font-medium text-orange-800 aria-pressed:bg-orange-800 aria-pressed:text-white"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <PibTrendChart
        series={panel.series}
        metric={metric}
        selectedYear={year}
        onSelectYear={onSelectYear}
      />
    </PanelSection>
  );
};

const VabSection = ({ panel, year }: { panel: PibPanel; year: number }) => {
  const vabYear = resolveBreakdownYear(
    panel.vab.map(({ ano }) => ano),
    year,
  );
  const vab = panel.vab.find(({ ano }) => ano === vabYear);

  return (
    <PanelSection title="Valor Adicionado Bruto (VAB) por setor">
      <BreakdownYearNote requestedYear={year} shownYear={vabYear} />
      {vab ? <VabSharesList shares={getVabShares(vab)} /> : <NoBreakdownData />}
    </PanelSection>
  );
};

const ActivitySection = ({
  panel,
  year,
}: {
  panel: PibPanel;
  year: number;
}) => {
  const activityYear = resolveBreakdownYear(
    panel.activities.map(({ ano }) => ano),
    year,
  );
  const activities = activityYear
    ? getActivitiesOfYear(panel, activityYear)
    : [];

  return (
    <PanelSection title="Atividade com maior VAB">
      <BreakdownYearNote requestedYear={year} shownYear={activityYear} />
      {activities.length ? (
        <ActivitiesList activities={activities} />
      ) : (
        <NoBreakdownData />
      )}
    </PanelSection>
  );
};

/** Same notice as the Power BI panel: IBGE releases VAB later than PIB. */
const BreakdownYearNote = ({
  requestedYear,
  shownYear,
}: {
  requestedYear: number;
  shownYear: number | null;
}) => {
  if (shownYear === null || shownYear === requestedYear) return null;

  return (
    <p className="rounded-md bg-orange-100 p-3 text-xs text-orange-800">
      Os dados de {requestedYear} ainda não foram disponibilizados pelo IBGE.
      Mostrando {shownYear}.
    </p>
  );
};

const NoBreakdownData = () => (
  <p className="text-sm text-[#5b5b5b]">Sem dados para este recorte.</p>
);

/** Table view of the trend chart, so the numbers never depend on the chart alone. */
const PibSeriesTable = ({ panel }: { panel: PibPanel }) => (
  <details className="rounded-md border border-orange-200 p-3">
    <summary className="cursor-pointer text-sm font-medium text-orange-800">
      Ver dados em tabela
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
        {[...panel.series].reverse().map((point) => (
          <tr key={point.ano} className="border-t border-orange-100">
            <td className="py-1">{point.ano}</td>
            <td className="py-1">{formatCompactBrl(point.pibTotal)}</td>
            <td className="py-1">{formatWholeBrl(point.pibPerCapita)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </details>
);

const PanelSection = ({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) => (
  <section className="flex flex-col gap-3">
    <div className="border-l-4 border-orange-600 pl-3">
      <h3 className="text-lg font-semibold text-[#292829]">{title}</h3>
      {hint && <p className="text-xs text-[#5b5b5b]">{hint}</p>}
    </div>
    {children}
  </section>
);

export default PibMobilePanel;
