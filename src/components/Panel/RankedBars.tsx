import type {
  ChartPoint,
  ValueFormatter,
} from "@/features/panels/chartOptions";

export const RankedBars = ({
  points,
  formatValue,
}: {
  points: ChartPoint[];
  formatValue: ValueFormatter;
}) => {
  const largest = Math.max(...points.map((point) => point.value), 0) || 1;

  return (
    <ul className="flex flex-col gap-4">
      {points.map((point) => (
        <li key={point.label} className="flex flex-col gap-1.5">
          <span className="text-base leading-snug text-grey-1100">
            {point.label}
          </span>
          <div className="flex items-center gap-3">
            <div className="h-5 flex-1 rounded-r bg-grey-100">
              <div
                className="h-full min-w-1 rounded-r bg-orange-600"
                style={{ width: `${(point.value / largest) * 100}%` }}
              />
            </div>
            <span className="w-16 shrink-0 text-right text-base font-semibold tabular-nums text-grey-1100">
              {formatValue(point.value)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
};
