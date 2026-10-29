import type {
  ChartPoint,
  ValueFormatter,
} from "@/features/panels/chartOptions";

const BarRow = ({
  point,
  largest,
  formatValue,
}: {
  point: ChartPoint;
  largest: number;
  formatValue: ValueFormatter;
}) => (
  <>
    <span className="text-base leading-snug text-grey-1100">{point.label}</span>
    <span className="flex items-center gap-3">
      <span className="h-5 flex-1 rounded-r bg-grey-100">
        <span
          className="block h-full min-w-1 rounded-r bg-orange-600 transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${(point.value / largest) * 100}%` }}
        />
      </span>
      <span className="w-16 shrink-0 text-right text-base font-semibold tabular-nums text-grey-1100">
        {formatValue(point.value)}
      </span>
    </span>
  </>
);

// Com `onSelect`, cada linha vira um botão de alternar (o filtro cruzado do Power BI).
export const RankedBars = ({
  points,
  formatValue,
  selectedLabel,
  onSelect,
}: {
  points: ChartPoint[];
  formatValue: ValueFormatter;
  selectedLabel?: string | null;
  onSelect?: (label: string | null) => void;
}) => {
  const largest = Math.max(...points.map((point) => point.value), 0) || 1;
  const row = (point: ChartPoint) => (
    <BarRow point={point} largest={largest} formatValue={formatValue} />
  );

  return (
    <ul className="flex flex-col gap-2">
      {points.map((point) => (
        <li key={point.label}>
          {onSelect ? (
            <button
              type="button"
              aria-pressed={point.label === selectedLabel}
              onClick={() =>
                onSelect(point.label === selectedLabel ? null : point.label)
              }
              className={`flex w-full flex-col gap-1.5 rounded-md p-1.5 text-left transition-opacity hover:bg-grey-100 focus-visible:outline-2 focus-visible:outline-green-800 aria-pressed:bg-orange-100 motion-reduce:transition-none ${selectedLabel && point.label !== selectedLabel ? "opacity-50" : ""}`}
            >
              {row(point)}
            </button>
          ) : (
            <div className="flex flex-col gap-1.5 p-1.5">{row(point)}</div>
          )}
        </li>
      ))}
    </ul>
  );
};
