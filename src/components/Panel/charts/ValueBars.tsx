import type {
  ChartPoint,
  ValueFormatter,
} from "@/features/panels/chartOptions";

// Espaço do número depois da ponta, para a maior barra não empurrá-lo para fora.
const VALUE_ROOM = "5rem";

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
    <ul className="flex flex-col gap-1.5">
      {points.map((point) => (
        <li key={point.label} className="flex items-center gap-2">
          <span className="w-32 shrink-0 text-right text-xs leading-tight text-grey-1100">
            {point.label}
          </span>
          <div className="flex min-w-0 flex-1 items-center">
            <div
              className={`h-4 min-w-1 ${barClassName}`}
              style={{
                width: `calc((100% - ${VALUE_ROOM}) * ${point.value / largest})`,
              }}
            />
            <span className="whitespace-nowrap px-1.5 text-xs tabular-nums text-grey-1100">
              {formatValue(point.value)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
};
