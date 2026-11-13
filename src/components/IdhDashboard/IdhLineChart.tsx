"use client";

import {
  type KeyboardEvent,
  type MouseEvent,
  type Ref,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ProtoTooltip,
  type TooltipAt,
} from "@/components/ProtoPanel/ProtoTooltip";
import { IDH_COLORS } from "@/components/IdhDashboard/idhColors";
import { PROTO_CHART_FONT } from "@/components/ProtoPanel/protoStyles";
import { formatIdh } from "@/features/panels/idh/idhFormat";
import {
  buildIdhLineGeometry,
  type IdhLineGeometry,
  linePath,
} from "@/features/panels/idh/idhLineChart";
import { stepCategory } from "@/features/panels/lineInteraction";
import type { IdhYearPoint } from "@/features/panels/idh/idhPanel";

const SERIES = [
  {
    key: "idh",
    label: "IDH",
    shortLabel: "IDH",
    color: IDH_COLORS.accentStrong,
    ink: IDH_COLORS.accentStrong,
    labelOffset: -10,
    pick: (point: IdhYearPoint) => point.idh,
  },
  {
    key: "idhAd",
    label: "IDH ajustado à desigualdade",
    shortLabel: "IDH ajustado",
    color: IDH_COLORS.accentSecond,
    ink: IDH_COLORS.accentSecondInk,
    labelOffset: 18,
    pick: (point: IdhYearPoint) => point.idhAjustado,
  },
] as const;

type SeriesKey = (typeof SERIES)[number]["key"];

const useElementWidth = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;
    const observer = new ResizeObserver(() => setWidth(element.clientWidth));

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return { ref, width };
};

// `.legend`: a série escondida fica riscada; a última visível não se esconde.
const Legend = ({
  hidden,
  onToggle,
}: {
  hidden: Set<SeriesKey>;
  onToggle: (key: SeriesKey) => void;
}) => (
  <div className="mb-1.5 flex flex-wrap gap-x-4 gap-y-2">
    {SERIES.map((series) => {
      const visible = !hidden.has(series.key);

      return (
        <button
          key={series.key}
          type="button"
          aria-pressed={visible}
          disabled={visible && hidden.size === SERIES.length - 1}
          onClick={() => onToggle(series.key)}
          className="inline-flex items-center gap-2 py-0.5 text-xs leading-4 aria-[pressed=false]:opacity-50 disabled:cursor-default [&[aria-pressed=false]_span]:line-through"
        >
          <i
            className="inline-block size-2.5 rounded-full"
            style={{ background: series.color }}
          />
          <span>{series.label}</span>
        </button>
      );
    })}
  </div>
);

const Axes = ({ geometry }: { geometry: IdhLineGeometry }) => {
  const { margin, width, height } = geometry;

  return (
    <>
      {geometry.ticks.map((tick) => (
        <g key={tick.value}>
          <line
            x1={margin.left}
            x2={width - margin.right}
            y1={tick.y}
            y2={tick.y}
            stroke={IDH_COLORS.line}
            strokeDasharray="3 4"
          />
          <text
            x={margin.left - 8}
            y={tick.y + 4}
            textAnchor="end"
            fontSize="11.5"
            fill={IDH_COLORS.muted}
          >
            {formatIdh(tick.value)}
          </text>
        </g>
      ))}
      {geometry.years.map((year) =>
        year.show ? (
          <text
            key={year.year}
            x={year.x}
            y={height - 8}
            textAnchor="middle"
            fontSize="11.5"
            fontWeight={year.selected ? 700 : 400}
            fill={year.selected ? IDH_COLORS.inkStrong : IDH_COLORS.muted}
          >
            {year.year}
          </text>
        ) : null,
      )}
      <line
        x1={geometry.selectedX}
        x2={geometry.selectedX}
        y1={margin.top}
        y2={height - margin.bottom}
        stroke={IDH_COLORS.accent}
        strokeWidth="1.2"
        strokeDasharray="4 4"
        opacity="0.55"
      />
    </>
  );
};

const Line = ({
  geometry,
  series,
  selectedIndex,
}: {
  geometry: IdhLineGeometry;
  series: (typeof SERIES)[number];
  selectedIndex: number;
}) => (
  <g>
    <path
      d={linePath(geometry.points[series.key])}
      fill="none"
      stroke={series.color}
      strokeWidth="2.4"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    {geometry.points[series.key].map((point, index) => (
      <circle
        key={index}
        cx={point.x.toFixed(1)}
        cy={point.y.toFixed(1)}
        r={index === selectedIndex ? 6 : 3.2}
        fill={index === selectedIndex ? series.color : "#ffffff"}
        stroke={series.color}
        strokeWidth="2"
      />
    ))}
    {geometry.labels[series.key].map((label) => (
      <text
        key={label.index}
        x={label.x}
        y={label.y}
        textAnchor={label.anchor}
        fontSize="12"
        fontWeight="700"
        fill={series.ink}
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinejoin="round"
        paintOrder="stroke"
      >
        {formatIdh(label.value)}
      </text>
    ))}
  </g>
);

const tooltipRows = (
  serie: IdhYearPoint[],
  index: number,
  hidden: Set<SeriesKey>,
) =>
  SERIES.filter((series) => !hidden.has(series.key)).map((series) => ({
    color: series.color,
    label: series.shortLabel,
    value: formatIdh(series.pick(serie[index])),
  }));

// Posição do ponteiro na área do gráfico vira o índice do ano mais próximo.
const yearIndexAt = (event: MouseEvent<SVGRectElement>, count: number) => {
  const rect = event.currentTarget.getBoundingClientRect();
  const fraction = (event.clientX - rect.left - 10) / (rect.width - 20);

  return Math.min(count - 1, Math.max(0, Math.round(fraction * (count - 1))));
};

/**
 * Gráfico de linhas do IDH e do IDH ajustado (`#lineBox` do protótipo), em
 * SVG: clique num ponto ou use as setas para escolher o ano.
 *
 * @example <IdhLineChart serie={panel.serie} ano={2021} onSelectYear={pick} svgRef={chart.ref} />
 */
export const IdhLineChart = ({
  serie,
  ano,
  onSelectYear,
  svgRef,
}: {
  serie: IdhYearPoint[];
  ano: number;
  onSelectYear: (ano: number) => void;
  svgRef?: Ref<SVGSVGElement>;
}) => {
  const { ref: boxRef, width: boxWidth } = useElementWidth();
  const [hidden, setHidden] = useState<Set<SeriesKey>>(new Set());
  const [tooltip, setTooltip] = useState<
    (TooltipAt & { index: number }) | null
  >(null);
  const years = serie.map((point) => point.ano);
  const selectedIndex = Math.max(0, years.indexOf(ano));
  const toggle = (key: SeriesKey) => {
    const next = new Set(hidden);

    if (!next.delete(key)) next.add(key);
    setHidden(next);
  };
  const handleKeyDown = (event: KeyboardEvent<SVGRectElement>) => {
    const next = stepCategory(years.map(String), String(ano), event.key);

    if (!next) return;
    event.preventDefault();
    onSelectYear(Number(next));
  };

  return (
    <>
      <Legend hidden={hidden} onToggle={toggle} />
      <div ref={boxRef} className="relative min-h-[280px]">
        {boxWidth && serie.length ? (
          <LineSvg
            geometry={buildIdhLineGeometry({
              width: boxWidth,
              years,
              series: SERIES.map((series) => ({
                key: series.key,
                labelOffset: series.labelOffset,
                values: serie.map(series.pick),
              })),
              selectedIndex,
            })}
            svgRef={svgRef}
            hidden={hidden}
            selectedIndex={selectedIndex}
            ano={ano}
            onPointerMove={(event) =>
              setTooltip({
                x: event.clientX,
                y: event.clientY,
                index: yearIndexAt(event, years.length),
              })
            }
            onPointerLeave={() => setTooltip(null)}
            onClick={(event) =>
              onSelectYear(years[yearIndexAt(event, years.length)])
            }
            onKeyDown={handleKeyDown}
          />
        ) : null}
      </div>
      <p className="mt-2 text-xs text-grey-800">
        Clique em um ponto da linha para escolher o ano.
      </p>
      {tooltip ? (
        <ProtoTooltip
          at={tooltip}
          title={String(years[tooltip.index])}
          rows={tooltipRows(serie, tooltip.index, hidden)}
        />
      ) : null}
    </>
  );
};

type HitHandlers = {
  onPointerMove: (event: MouseEvent<SVGRectElement>) => void;
  onPointerLeave: () => void;
  onClick: (event: MouseEvent<SVGRectElement>) => void;
  onKeyDown: (event: KeyboardEvent<SVGRectElement>) => void;
};

const LineSvg = ({
  geometry,
  svgRef,
  hidden,
  selectedIndex,
  ano,
  ...handlers
}: HitHandlers & {
  geometry: IdhLineGeometry;
  svgRef?: Ref<SVGSVGElement>;
  hidden: Set<SeriesKey>;
  selectedIndex: number;
  ano: number;
}) => {
  const { margin, width, height, years } = geometry;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      height={height}
      role="group"
      aria-label={`Evolução anual do IDH e do IDH ajustado à desigualdade, ${years[0]?.year} a ${years[years.length - 1]?.year}`}
      fontFamily={PROTO_CHART_FONT}
      className="block w-full touch-pan-y overflow-visible [font-variant-numeric:tabular-nums]"
    >
      <Axes geometry={geometry} />
      {SERIES.filter((series) => !hidden.has(series.key)).map((series) => (
        <Line
          key={series.key}
          geometry={geometry}
          series={series}
          selectedIndex={selectedIndex}
        />
      ))}
      <rect
        x={margin.left - 10}
        y={margin.top}
        width={width - margin.left - margin.right + 20}
        height={height - margin.top - margin.bottom + 8}
        fill="transparent"
        tabIndex={0}
        role="slider"
        aria-label="Ano selecionado"
        aria-valuemin={years[0]?.year}
        aria-valuemax={years[years.length - 1]?.year}
        aria-valuenow={ano}
        className="cursor-pointer outline-none focus-visible:stroke-[#7c46e1] focus-visible:stroke-2"
        {...handlers}
      />
    </svg>
  );
};
