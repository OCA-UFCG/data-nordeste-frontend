import type { PointerEvent } from "react";
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
          className="block h-full min-w-1 rounded-r bg-orange-600 transition-[width,background-color] duration-500 ease-out group-hover:bg-orange-700 motion-reduce:transition-none"
          style={{ width: `${(point.value / largest) * 100}%` }}
        />
      </span>
      <span className="w-16 shrink-0 text-right text-base font-semibold tabular-nums text-grey-1100">
        {formatValue(point.value)}
      </span>
    </span>
  </>
);

type PreviewHandler = (label: string | null) => void;

// Só com mouse: no toque, o pointerenter vem junto do toque e o clique já fixa.
const previewOnMouse =
  (onPreview: PreviewHandler | undefined, label: string | null) =>
  (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse") onPreview?.(label);
  };

// Com `onSelect`, cada linha vira um botão de alternar (o filtro cruzado do
// Power BI); `onPreview` recebe a linha sob o mouse e null ao sair da lista.
export const RankedBars = ({
  points,
  formatValue,
  selectedLabel,
  onSelect,
  onPreview,
}: {
  points: ChartPoint[];
  formatValue: ValueFormatter;
  selectedLabel?: string | null;
  onSelect?: (label: string | null) => void;
  onPreview?: PreviewHandler;
}) => {
  const largest = Math.max(...points.map((point) => point.value), 0) || 1;
  const row = (point: ChartPoint) => (
    <BarRow point={point} largest={largest} formatValue={formatValue} />
  );

  return (
    <ul
      className="flex flex-col gap-2"
      onPointerLeave={previewOnMouse(onPreview, null)}
    >
      {points.map((point) => (
        <li key={point.label}>
          {onSelect ? (
            <button
              type="button"
              aria-pressed={point.label === selectedLabel}
              onClick={() =>
                onSelect(point.label === selectedLabel ? null : point.label)
              }
              onPointerEnter={previewOnMouse(onPreview, point.label)}
              className={`group flex w-full cursor-pointer flex-col gap-1.5 rounded-md p-1.5 text-left transition-[opacity,background-color] hover:bg-orange-100/60 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-green-800 aria-pressed:bg-orange-100 motion-reduce:transition-none ${selectedLabel && point.label !== selectedLabel ? "opacity-50" : ""}`}
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
