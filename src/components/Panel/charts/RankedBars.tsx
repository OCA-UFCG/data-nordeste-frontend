import type { PointerEvent } from "react";
import type {
  ChartPoint,
  ValueFormatter,
} from "@/features/panels/chartOptions";

type BarStyle = { barClassName?: string; valueClassName?: string };

const BarRow = ({
  point,
  largest,
  formatValue,
  barClassName = "bg-orange-600 group-hover:bg-orange-700",
  valueClassName = "w-16",
}: {
  point: ChartPoint;
  largest: number;
  formatValue: ValueFormatter;
} & BarStyle) => (
  <>
    <span className="text-base leading-snug text-grey-1100">{point.label}</span>
    <span className="flex items-center gap-3">
      <span className="h-5 flex-1 rounded-r bg-grey-100">
        <span
          className={`block h-full min-w-1 rounded-r transition-[width,background-color] duration-500 ease-out motion-reduce:transition-none ${barClassName}`}
          style={{ width: `${(point.value / largest) * 100}%` }}
        />
      </span>
      <span
        className={`shrink-0 text-right text-base font-semibold tabular-nums text-grey-1100 ${valueClassName}`}
      >
        {formatValue(point.value)}
      </span>
    </span>
  </>
);

export type PreviewHandler = (label: string | null) => void;

// Só com mouse: no toque, o pointerenter vem junto do toque e o clique já fixa.
export const previewOnMouse =
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
  barClassName,
  valueClassName,
  spread = false,
  rowClassName = "hover:bg-orange-100/60 aria-pressed:bg-orange-100",
}: {
  points: ChartPoint[];
  formatValue: ValueFormatter;
  selectedLabel?: string | null;
  onSelect?: (label: string | null) => void;
  onPreview?: PreviewHandler;

  // Num card esticado pela grade, reparte a sobra entre as linhas em vez de
  // deixá-la vazia embaixo.
  spread?: boolean;
  rowClassName?: string;
} & BarStyle) => {
  const largest = Math.max(...points.map((point) => point.value), 0) || 1;
  const row = (point: ChartPoint) => (
    <BarRow
      point={point}
      largest={largest}
      formatValue={formatValue}
      barClassName={barClassName}
      valueClassName={valueClassName}
    />
  );

  return (
    <ul
      className={`group/bars flex flex-col gap-2 ${spread ? "flex-1 justify-between" : ""}`}
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
              className={`group flex w-full cursor-pointer flex-col gap-1.5 rounded-md p-1.5 text-left transition-[opacity,background-color] hover:opacity-100 focus-visible:outline-2 focus-visible:outline-green-800 motion-reduce:transition-none ${rowClassName} ${selectedLabel && point.label !== selectedLabel ? "opacity-50" : ""}`}
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
