"use client";
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  PibActivity,
  PibSeriesPoint,
  VabShare,
} from "@/features/panels/pibPanel";
import {
  formatCompactBrl,
  formatPercent,
  formatWholeBrl,
} from "@/features/panels/pibFormat";

// Economia e Renda uses the orange theme (--color-orange-* in globals.css).
// Recharts needs literal colors, so the two steps used are mirrored here.
const SERIES_COLOR = "#e65e10";
const MARKER_COLOR = "#fcd9ac";
const AXIS_TICK = { fontSize: 12, fill: "#5b5b5b" };

export type PibTrendMetric = "pibTotal" | "pibPerCapita";

const METRIC_FORMATTERS: {
  [metric in PibTrendMetric]: (value: number) => string;
} = {
  pibTotal: formatCompactBrl,
  pibPerCapita: formatWholeBrl,
};

type ChartClickState = { activeLabel?: string | number } | null;

/** Yearly line of one metric; tapping a point selects that year in the filters. */
export const PibTrendChart = ({
  series,
  metric,
  selectedYear,
  onSelectYear,
}: {
  series: PibSeriesPoint[];
  metric: PibTrendMetric;
  selectedYear: number;
  onSelectYear: (ano: number) => void;
}) => {
  const format = METRIC_FORMATTERS[metric];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart
        data={series}
        margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
        onClick={(state: ChartClickState) =>
          selectYearFromChart(state, onSelectYear)
        }
      >
        <XAxis dataKey="ano" tick={AXIS_TICK} tickLine={false} />
        <YAxis
          tick={AXIS_TICK}
          tickFormatter={(value: number) => format(value)}
          tickLine={false}
          axisLine={false}
          width={76}
        />
        <Tooltip
          formatter={(value) => [format(Number(value)), "Valor"]}
          labelFormatter={(label) => `Ano ${label}`}
        />
        <ReferenceLine x={selectedYear} stroke={MARKER_COLOR} strokeWidth={2} />
        <Line
          dataKey={metric}
          stroke={SERIES_COLOR}
          strokeWidth={2}
          dot={{ r: 4, fill: SERIES_COLOR }}
          activeDot={{ r: 7 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

function selectYearFromChart(
  state: ChartClickState,
  onSelectYear: (ano: number) => void,
): void {
  const ano = Number(state?.activeLabel);

  if (Number.isFinite(ano)) onSelectYear(ano);
}

/** Plain HTML bars: four sectors read better as labelled rows than as a pie. */
export const VabSharesList = ({ shares }: { shares: VabShare[] }) => (
  <ul className="flex flex-col gap-3">
    {shares.map((item) => (
      <ShareRow
        key={item.sector}
        label={item.label}
        detail={`${formatPercent(item.share)} · ${formatCompactBrl(item.value)}`}
        share={item.share}
      />
    ))}
  </ul>
);

/**
 * Main activity (largest VAB) across the selection's municipalities. The bar is
 * the share of municipalities; the text adds that activity's share of their PIB.
 */
export const ActivitiesList = ({
  activities,
}: {
  activities: PibActivity[];
}) => {
  const total = activities.reduce((sum, item) => sum + item.municipalities, 0);

  return (
    <ul className="flex flex-col gap-3">
      {activities.map((item) => (
        <ShareRow
          key={item.activity}
          label={item.activity}
          detail={activityDetail(item)}
          share={total ? item.municipalities / total : 0}
        />
      ))}
    </ul>
  );
};

const activityDetail = (item: PibActivity): string => {
  const municipalities =
    item.municipalities === 1
      ? "1 município"
      : `${item.municipalities} municípios`;

  return `${municipalities} · ${formatPercent(item.pibShare)} do PIB`;
};

const ShareRow = ({
  label,
  detail,
  share,
}: {
  label: string;
  detail: string;
  share: number;
}) => (
  <li className="flex flex-col gap-1">
    <span className="text-sm text-[#292829]">{label}</span>
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 rounded bg-orange-100">
        <div
          className="h-2 rounded bg-orange-700"
          style={{ width: `${share * 100}%` }}
        />
      </div>
      <span className="shrink-0 text-xs font-medium text-[#5b5b5b]">
        {detail}
      </span>
    </div>
  </li>
);
