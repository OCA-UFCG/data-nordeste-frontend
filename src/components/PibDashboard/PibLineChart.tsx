"use client";

import { type Ref, useMemo } from "react";
import { PIB_COLORS } from "@/components/PibDashboard/pibTheme";
import {
  type LineYearHandlers,
  ProtoYearSlider,
  useLineYear,
} from "@/components/ProtoPanel/ProtoLineYear";
import {
  ProtoSeriesLegend,
  useHiddenSeries,
} from "@/components/ProtoPanel/ProtoSeriesLegend";
import { ProtoSkeleton } from "@/components/ProtoPanel/ProtoCard";
import { ProtoTooltip } from "@/components/ProtoPanel/ProtoTooltip";
import { PROTO_CHART_FONT } from "@/components/ProtoPanel/protoStyles";
import { useElementWidth } from "@/components/ProtoPanel/useElementWidth";
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

// Altura do gráfico e do esqueleto: PIB_LINE_HEIGHT acima de PIB_LINE_NARROW_WIDTH.
export const PIB_LINE_HEIGHT_CLASS = "min-h-[300px] @[560px]:min-h-[340px]";

// Cada eixo some junto com a sua série.
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
            fill={PIB_COLORS.muted}
          >
            {formatPibAxis(tick.pib)}
          </text>
        )}
        {hidden.has("perCapita") ? null : (
          <text
            x={geometry.width - geometry.margin.right + 8}
            y={tick.y + 4}
            fontSize={AXIS_FONT_SIZE}
            fill={PIB_COLORS.muted}
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
    {geometry.selectedX === null ? null : (
      <line
        x1={geometry.selectedX}
        x2={geometry.selectedX}
        y1={geometry.margin.top}
        y2={geometry.height - geometry.margin.bottom}
        stroke={PIB_COLORS.inkStrong}
        strokeOpacity="0.25"
        strokeDasharray="4 4"
      />
    )}
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
  const label = geometry.labels?.[series.key];

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
      {label ? (
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
      ) : null}
    </g>
  );
};

const LineSvg = ({
  geometry,
  svgRef,
  hidden,
  selectedIndex,
  ano,
  ...handlers
}: LineYearHandlers & {
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
      <ProtoYearSlider
        frame={geometry}
        years={years.map((year) => year.year)}
        ano={ano}
        focusClassName="focus-visible:stroke-[#e5640f]"
        {...handlers}
      />
    </svg>
  );
};

const tooltipRows = (point: PibYearPoint, hidden: Set<PibLineKey>) =>
  SERIES.filter((series) => !hidden.has(series.key)).map((series) => ({
    color: series.color,
    label: series.shortLabel,
    value: formatPibReais(series.pick(point)),
  }));

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
  const years = useMemo(() => serie.map((point) => point.ano), [serie]);
  const { selectedIndex, hover, handlers } = useLineYear({
    years,
    ano,
    onSelectYear,
  });

  // PERF: o tooltip muda a cada movimento do ponteiro; a geometria só muda
  // com a largura, a série ou o ano.
  const geometry = useMemo(
    () =>
      boxWidth && serie.length
        ? buildPibLineGeometry({ width: boxWidth, serie, selectedIndex })
        : null,
    [boxWidth, serie, selectedIndex],
  );
  const hoverPoint = hover && serie.find((point) => point.ano === hover.ano);

  return (
    <>
      <ProtoSeriesLegend series={SERIES} hidden={hidden} onToggle={toggle} />
      {/* Reserva a altura final antes de medir a largura: sem salto na hidratação. */}
      <div className="@container">
        <div ref={boxRef} className={`relative ${PIB_LINE_HEIGHT_CLASS}`}>
          {geometry ? (
            <LineSvg
              geometry={geometry}
              svgRef={svgRef}
              hidden={hidden}
              selectedIndex={selectedIndex}
              ano={ano}
              {...handlers}
            />
          ) : null}
        </div>
      </div>
      <p className="mt-2 text-xs text-grey-800">
        Clique em um ponto da linha para escolher o ano.
      </p>
      {hover && hoverPoint ? (
        <ProtoTooltip
          at={hover}
          title={String(hoverPoint.ano)}
          rows={tooltipRows(hoverPoint, hidden)}
        />
      ) : null}
    </>
  );
};

/**
 * Esqueleto do corpo do card com as alturas do gráfico pronto (legenda,
 * gráfico e dica), para o card não mudar de tamanho quando os dados chegam.
 *
 * @example <ProtoCard skeleton={<PibLineChartSkeleton />} … />
 */
export const PibLineChartSkeleton = () => (
  <>
    <ProtoSkeleton className="mb-1.5 h-5 w-[45%]" />
    <div className="@container">
      <ProtoSkeleton className={PIB_LINE_HEIGHT_CLASS} />
    </div>
    <ProtoSkeleton className="mt-2 h-4 w-[40%]" />
  </>
);
