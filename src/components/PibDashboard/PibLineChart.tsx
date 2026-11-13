"use client";

import { type KeyboardEvent, type MouseEvent, type Ref, useState } from "react";
import { PIB_COLORS } from "@/components/PibDashboard/pibTheme";
import {
  ProtoSeriesLegend,
  useHiddenSeries,
} from "@/components/ProtoPanel/ProtoSeriesLegend";
import {
  ProtoTooltip,
  type TooltipAt,
} from "@/components/ProtoPanel/ProtoTooltip";
import { PROTO_CHART_FONT } from "@/components/ProtoPanel/protoStyles";
import { useElementWidth } from "@/components/ProtoPanel/useElementWidth";
import { stepCategory } from "@/features/panels/lineInteraction";
import { formatPibAxis, formatPibReais } from "@/features/panels/pib/pibFormat";
import {
  buildPibLineGeometry,
  type PibLineGeometry,
  type PibLineKey,
} from "@/features/panels/pib/pibLineChart";
import type { PibYearPoint } from "@/features/panels/pib/pibPanel";
import { linePath } from "@/features/panels/svgPath";

type PibLineSeries = {
  key: PibLineKey;
  label: string;
  shortLabel: string;
  color: string;
  ink: string;
  pick: (point: PibYearPoint) => number;
};

const SERIES: readonly PibLineSeries[] = [
  {
    key: "pib",
    label: "PIB total (R$)",
    shortLabel: "PIB total",
    color: PIB_COLORS.total,
    ink: PIB_COLORS.totalInk,
    pick: (point) => point.pib,
  },
  {
    key: "perCapita",
    label: "PIB per capita (R$ mil)",
    shortLabel: "PIB per capita",
    color: PIB_COLORS.perCapita,
    ink: PIB_COLORS.perCapitaInk,
    pick: (point) => point.perCapita,
  },
];

const AXIS_FONT_SIZE = "11.5";

// Cada eixo leva a tinta da sua série e some junto com ela.
const TickLabels = ({
  geometry,
  hidden,
}: {
  geometry: PibLineGeometry;
  hidden: Set<PibLineKey>;
}) => (
  <>
    {geometry.ticks.map((tick) => (
      <g key={tick.pib}>
        <line
          x1={geometry.margin.left}
          x2={geometry.width - geometry.margin.right}
          y1={tick.y}
          y2={tick.y}
          stroke={PIB_COLORS.line}
          strokeDasharray="3 4"
        />
        {hidden.has("pib") ? null : (
          <text
            x={geometry.margin.left - 8}
            y={tick.y + 4}
            textAnchor="end"
            fontSize={AXIS_FONT_SIZE}
            fill={PIB_COLORS.totalInk}
          >
            {formatPibAxis(tick.pib)}
          </text>
        )}
        {hidden.has("perCapita") ? null : (
          <text
            x={geometry.width - geometry.margin.right + 8}
            y={tick.y + 4}
            fontSize={AXIS_FONT_SIZE}
            fill={PIB_COLORS.perCapitaInk}
          >
            {formatPibAxis(tick.perCapita)}
          </text>
        )}
      </g>
    ))}
  </>
);

const YearAxis = ({ geometry }: { geometry: PibLineGeometry }) => (
  <>
    {geometry.years.map((year) =>
      year.show ? (
        <text
          key={year.year}
          x={year.x}
          y={geometry.height - 8}
          textAnchor="middle"
          fontSize={AXIS_FONT_SIZE}
          fontWeight={year.selected ? 700 : 400}
          fill={year.selected ? PIB_COLORS.inkStrong : PIB_COLORS.muted}
        >
          {year.year}
        </text>
      ) : null,
    )}
    <line
      x1={geometry.selectedX}
      x2={geometry.selectedX}
      y1={geometry.margin.top}
      y2={geometry.height - geometry.margin.bottom}
      stroke={PIB_COLORS.inkStrong}
      strokeOpacity="0.25"
      strokeDasharray="4 4"
    />
  </>
);

const Line = ({
  geometry,
  series,
  selectedIndex,
}: {
  geometry: PibLineGeometry;
  series: PibLineSeries;
  selectedIndex: number;
}) => {
  const points = geometry.points[series.key];
  const label = geometry.labels[series.key];

  return (
    <g>
      <path
        d={linePath(points)}
        fill="none"
        stroke={series.color}
        strokeWidth="2.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((point, index) => {
        const selected = index === selectedIndex;

        return (
          <circle
            key={index}
            cx={point.x.toFixed(1)}
            cy={point.y.toFixed(1)}
            r={selected ? 6 : geometry.narrow ? 2.5 : 3.2}
            fill={selected ? series.color : "#ffffff"}
            stroke={selected ? "#ffffff" : series.color}
            strokeWidth={selected ? 2.4 : 2}
          />
        );
      })}
      <text
        x={label.x}
        y={label.y}
        textAnchor={label.anchor}
        fontSize="13"
        fontWeight="700"
        fill={series.ink}
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinejoin="round"
        paintOrder="stroke"
      >
        {formatPibReais(label.value)}
      </text>
    </g>
  );
};

type HitHandlers = {
  onPointerMove: (event: MouseEvent<SVGRectElement>) => void;
  onPointerLeave: () => void;
  onClick: (event: MouseEvent<SVGRectElement>) => void;
  onKeyDown: (event: KeyboardEvent<SVGRectElement>) => void;
};

// Área do gráfico que recebe o ponteiro e o teclado: é um `slider` do ano.
const HitArea = ({
  geometry,
  ano,
  ...handlers
}: HitHandlers & { geometry: PibLineGeometry; ano: number }) => {
  const { margin, width, height, years } = geometry;

  return (
    <rect
      x={margin.left}
      y={margin.top}
      width={width - margin.left - margin.right}
      height={height - margin.top - margin.bottom}
      fill="transparent"
      tabIndex={0}
      role="slider"
      aria-label="Ano selecionado"
      aria-valuemin={years[0]?.year}
      aria-valuemax={years[years.length - 1]?.year}
      aria-valuenow={ano}
      className="cursor-pointer outline-none focus-visible:stroke-[#e5640f] focus-visible:stroke-2"
      {...handlers}
    />
  );
};

const LineSvg = ({
  geometry,
  svgRef,
  hidden,
  selectedIndex,
  ano,
  ...handlers
}: HitHandlers & {
  geometry: PibLineGeometry;
  svgRef?: Ref<SVGSVGElement>;
  hidden: Set<PibLineKey>;
  selectedIndex: number;
  ano: number;
}) => {
  const { width, height, years } = geometry;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      height={height}
      role="group"
      aria-label={`Evolução anual do PIB total e do PIB per capita, ${years[0]?.year} a ${years[years.length - 1]?.year}`}
      fontFamily={PROTO_CHART_FONT}
      className="block w-full touch-pan-y overflow-visible [font-variant-numeric:tabular-nums]"
    >
      <TickLabels geometry={geometry} hidden={hidden} />
      <YearAxis geometry={geometry} />
      {SERIES.filter((series) => !hidden.has(series.key)).map((series) => (
        <Line
          key={series.key}
          geometry={geometry}
          series={series}
          selectedIndex={selectedIndex}
        />
      ))}
      <HitArea geometry={geometry} ano={ano} {...handlers} />
    </svg>
  );
};

// Posição do ponteiro na área do gráfico vira o índice do ano mais próximo.
const yearIndexAt = (event: MouseEvent<SVGRectElement>, count: number) => {
  const rect = event.currentTarget.getBoundingClientRect();
  const fraction = (event.clientX - rect.left) / rect.width;

  return Math.min(count - 1, Math.max(0, Math.round(fraction * (count - 1))));
};

const tooltipRows = (point: PibYearPoint, hidden: Set<PibLineKey>) =>
  SERIES.filter((series) => !hidden.has(series.key)).map((series) => ({
    color: series.color,
    label: series.shortLabel,
    value: formatPibReais(series.pick(point)),
  }));

type LineTooltip = TooltipAt & { index: number };

/**
 * Gráfico "Evolução anual do PIB" (`#lineBox` do protótipo), em SVG: PIB
 * total e per capita, cada um com o seu eixo. Clique num ponto ou use as
 * setas para escolher o ano; a legenda mostra e esconde as séries.
 *
 * @example <PibLineChart serie={panel.serie} ano={2023} onSelectYear={pick} svgRef={chart.ref} />
 */
export const PibLineChart = ({
  serie,
  ano,
  onSelectYear,
  svgRef,
}: {
  serie: PibYearPoint[];
  ano: number;
  onSelectYear: (ano: number) => void;
  svgRef?: Ref<SVGSVGElement>;
}) => {
  const { ref: boxRef, width: boxWidth } = useElementWidth();
  const { hidden, toggle } = useHiddenSeries<PibLineKey>();
  const [tooltip, setTooltip] = useState<LineTooltip | null>(null);
  const years = serie.map((point) => point.ano);
  const selectedIndex = Math.max(0, years.indexOf(ano));
  const handleKeyDown = (event: KeyboardEvent<SVGRectElement>) => {
    const next = stepCategory(years.map(String), String(ano), event.key);

    if (!next) return;
    event.preventDefault();
    onSelectYear(Number(next));
  };

  return (
    <>
      <ProtoSeriesLegend series={SERIES} hidden={hidden} onToggle={toggle} />
      <div ref={boxRef} className="relative min-h-[300px]">
        {boxWidth && serie.length ? (
          <LineSvg
            geometry={buildPibLineGeometry({
              width: boxWidth,
              serie,
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
          rows={tooltipRows(serie[tooltip.index], hidden)}
        />
      ) : null}
    </>
  );
};
