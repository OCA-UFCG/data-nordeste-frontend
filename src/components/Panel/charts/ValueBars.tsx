import {
  previewOnMouse,
  type PreviewHandler,
} from "@/components/Panel/charts/RankedBars";
import type {
  ChartPoint,
  ValueFormatter,
} from "@/features/panels/chartOptions";

// Espaço do número depois da ponta, para a maior barra não empurrá-lo para fora.
const VALUE_ROOM = "5rem";

const BarRow = ({
  point,
  largest,
  formatValue,
  barClassName,
}: {
  point: ChartPoint;
  largest: number;
  formatValue: ValueFormatter;
  barClassName: string;
}) => (
  <>
    <span className="w-32 shrink-0 text-right text-xs leading-tight text-grey-1100">
      {point.label}
    </span>
    <span className="flex min-w-0 flex-1 items-center">
      <span
        className={`h-4 min-w-1 ${barClassName}`}
        style={{
          width: `calc((100% - ${VALUE_ROOM}) * ${point.value / largest})`,
        }}
      />
      <span className="whitespace-nowrap px-1.5 text-xs tabular-nums text-grey-1100">
        {formatValue(point.value)}
      </span>
    </span>
  </>
);

// Com `onSelect`, cada linha vira um botão de alternar; `onPreview` recebe a
// linha sob o mouse e null ao sair da lista (como as atividades do PIB).
export const ValueBars = ({
  points,
  formatValue,
  barClassName,
  selectedLabel,
  onSelect,
  onPreview,
}: {
  points: ChartPoint[];
  formatValue: ValueFormatter;
  barClassName: string;
  selectedLabel?: string | null;
  onSelect?: (label: string) => void;
  onPreview?: PreviewHandler;
}) => {
  const largest = Math.max(...points.map((point) => point.value), 0) || 1;

  return (
    <ul
      className="group/bars flex flex-col gap-0.5"
      onPointerLeave={previewOnMouse(onPreview, null)}
    >
      {points.map((point) => {
        const row = (
          <BarRow
            point={point}
            largest={largest}
            formatValue={formatValue}
            barClassName={barClassName}
          />
        );

        return (
          <li key={point.label}>
            {onSelect ? (
              <button
                type="button"
                aria-pressed={point.label === selectedLabel}
                onClick={() => onSelect(point.label)}
                onPointerEnter={previewOnMouse(onPreview, point.label)}
                onFocus={() => onPreview?.(point.label)}
                onBlur={() => onPreview?.(null)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-0.5 py-0.5 text-left transition-opacity group-hover/bars:opacity-60 hover:bg-pink-100/60 hover:opacity-100! motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-green-800 aria-pressed:bg-pink-100"
              >
                {row}
              </button>
            ) : (
              <div className="flex items-center gap-2 py-0.5">{row}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
};
