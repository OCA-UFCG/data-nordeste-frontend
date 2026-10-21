"use client";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  PibRankingItem,
  PibSeriesPoint,
  VabShare,
} from "@/features/panels/pibPanel";
import { formatCompactBrl } from "@/features/panels/pibFormat";

// Brand greens from globals.css (--color-green-800 / -1000). The ranking uses
// one hue: the selected UF is dark, the rest recede to a neutral gray.
const SERIES_COLOR = "#018f39";
const SELECTED_COLOR = "#085f2d";
const MUTED_COLOR = "#c8cdc9";
const AXIS_TICK = { fontSize: 12, fill: "#5b5b5b" };
const RANKING_ROW_HEIGHT = 32;

type ChartClickState = { activeLabel?: string | number } | null;

export const PibTrendChart = ({
  series,
  selectedYear,
  onSelectYear,
}: {
  series: PibSeriesPoint[];
  selectedYear: number;
  onSelectYear: (ano: number) => void;
}) => (
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
        tickFormatter={(value: number) => formatCompactBrl(value)}
        tickLine={false}
        axisLine={false}
        width={72}
      />
      <Tooltip
        formatter={(value) => [formatCompactBrl(Number(value)), "PIB"]}
        labelFormatter={(label) => `Ano ${label}`}
      />
      <ReferenceLine
        x={selectedYear}
        stroke={MUTED_COLOR}
        strokeDasharray="4 4"
      />
      <Line
        dataKey="pibTotal"
        stroke={SERIES_COLOR}
        strokeWidth={2}
        dot={{ r: 4, fill: SERIES_COLOR }}
        activeDot={{ r: 7 }}
        isAnimationActive={false}
      />
    </LineChart>
  </ResponsiveContainer>
);

function selectYearFromChart(
  state: ChartClickState,
  onSelectYear: (ano: number) => void,
): void {
  const ano = Number(state?.activeLabel);

  if (Number.isFinite(ano)) onSelectYear(ano);
}

export const PibRankingChart = ({
  ranking,
  selectedUf,
  valueFormatter,
  onSelectUf,
}: {
  ranking: PibRankingItem[];
  selectedUf: string;
  valueFormatter: (value: number) => string;
  onSelectUf: (uf: string) => void;
}) => (
  <ResponsiveContainer
    width="100%"
    height={ranking.length * RANKING_ROW_HEIGHT + 16}
  >
    <BarChart
      data={ranking}
      layout="vertical"
      margin={{ top: 0, right: 12, bottom: 0, left: 0 }}
    >
      <XAxis type="number" hide />
      <YAxis
        type="category"
        dataKey="uf"
        tick={AXIS_TICK}
        tickLine={false}
        axisLine={false}
        width={32}
      />
      <Tooltip
        formatter={(value) => [valueFormatter(Number(value)), "Valor"]}
        cursor={{ fill: "#f2f2f2" }}
      />
      <Bar
        dataKey="value"
        radius={[0, 4, 4, 0]}
        barSize={20}
        isAnimationActive={false}
        onClick={(item: PibRankingItem) => onSelectUf(item.uf)}
      >
        {ranking.map((item) => (
          <Cell
            key={item.uf}
            cursor="pointer"
            fill={item.uf === selectedUf ? SELECTED_COLOR : MUTED_COLOR}
          />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

/** Plain HTML bars: four sectors read better as labelled rows than as a pie. */
export const VabSharesList = ({ shares }: { shares: VabShare[] }) => {
  if (!shares.length) {
    return (
      <p className="text-sm text-[#5b5b5b]">Sem dados de VAB para este ano.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {shares.map((item) => (
        <VabShareRow key={item.sector} item={item} />
      ))}
    </ul>
  );
};

const VabShareRow = ({ item }: { item: VabShare }) => (
  <li className="flex flex-col gap-1">
    <div className="flex justify-between text-sm text-[#292829]">
      <span>{item.label}</span>
      <span className="font-medium">
        {(item.share * 100).toLocaleString("pt-BR", {
          maximumFractionDigits: 1,
        })}
        % · {formatCompactBrl(item.value)}
      </span>
    </div>
    <div className="h-2 w-full rounded bg-[#efefef]">
      <div
        className="h-2 rounded bg-green-800"
        style={{ width: `${item.share * 100}%` }}
      />
    </div>
  </li>
);
