import type {
  ChartPoint,
  ValueFormatter,
} from "@/features/panels/chartOptions";

// Barra longa leva o número dentro; curta, logo depois da ponta (Figma).
const INSIDE_SHARE = 0.6;

const BarValue = ({ children }: { children: string }) => (
  <span className="whitespace-nowrap px-2 text-sm tabular-nums text-grey-1100">
    {children}
  </span>
);

export const ValueBars = ({
  points,
  formatValue,
  barClassName,
}: {
  points: ChartPoint[];
  formatValue: ValueFormatter;
  barClassName: string;
}) => {
  const largest = Math.max(...points.map((point) => point.value), 0) || 1;

  return (
    <ul className="flex flex-col gap-4">
      {points.map((point) => {
        const share = point.value / largest;
        const value = formatValue(point.value);

        return (
          <li key={point.label} className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-sm font-medium text-grey-1100 lg:w-44">
              {point.label}
            </span>
            <div className="flex min-w-0 flex-1 items-center">
              <div
                className={`flex h-[35px] min-w-1 items-center justify-end ${barClassName}`}
                style={{ width: `${share * 100}%` }}
              >
                {share >= INSIDE_SHARE ? <BarValue>{value}</BarValue> : null}
              </div>
              {share < INSIDE_SHARE ? <BarValue>{value}</BarValue> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
};
