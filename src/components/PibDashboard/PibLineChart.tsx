"use client";

import { type Ref, useMemo } from "react";
import { PIB_LINE_TITLES } from "@/components/PibDashboard/pibTexts";
import { PIB_COLORS } from "@/components/PibDashboard/pibTheme";
import {
  type LineYearHandlers,
  ProtoYearSlider,
  useLineYear,
} from "@/components/ProtoPanel/ProtoLineYear";
import { ProtoSkeleton } from "@/components/ProtoPanel/ProtoCard";
import { ProtoTooltip } from "@/components/ProtoPanel/ProtoTooltip";
import { PROTO_CHART_FONT } from "@/components/ProtoPanel/protoStyles";
import { useElementWidth } from "@/components/ProtoPanel/useElementWidth";
import { formatPibAxis, formatPibReais } from "@/features/panels/pib/pibFormat";
import type { PibBarUnit } from "@/features/panels/pib/pibBars";
import {
  buildPibLineGeometry,
  PIB_LINE_TITLE_Y,
  type PibLineGeometry,
  type PibLineKey,
  pibLineUnits,
} from "@/features/panels/pib/pibLineChart";
import type { PibYearPoint } from "@/features/panels/pib/pibPanel";
import { linePath } from "@/features/panels/svgPath";

type PibLineSeries = {
  shortLabel: string;
  color: string;
  ink: string;
  pick: (point: PibYearPoint) => number;
};

const SERIES: Record<PibLineKey, PibLineSeries> = {
  pib: {
    shortLabel: "PIB total",
    color: PIB_COLORS.total,
    ink: PIB_COLORS.totalInk,
    pick: (point) => point.pib,
  },
  perCapita: {
    shortLabel: "PIB per capita",
    color: PIB_COLORS.perCapita,
    ink: PIB_COLORS.perCapitaInk,
    pick: (point) => point.perCapita,
  },
};

const AXIS_FONT_SIZE = "11.5";

// Altura do gráfico e do esqueleto: PIB_LINE_HEIGHT acima de PIB_LINE_NARROW_WIDTH.
export const PIB_LINE_HEIGHT_CLASS = "min-h-[320px] @[560px]:min-h-[360px]";

const Gridlines = ({ geometry }: { geometry: PibLineGeometry }) => (
  <>
    {geometry.ticks.map((tick) => (
      <line
        key={tick.value}
        x1={geometry.margin.left}
        x2={geometry.width - geometry.margin.right}
        y1={tick.y}
        y2={tick.y}
        stroke={PIB_COLORS.line}
        strokeDasharray="3 4"
      />
    ))}
  </>
);

// Unidade acima do eixo ("R$ bilhões"): a série já está no título do card.
// Texto na tinta escura da série, que passa o contraste AA no branco.
const ValueAxis = ({
  geometry,
  series,
  unit,
}: {
  geometry: PibLineGeometry;
  series: PibLineSeries;
  unit: PibBarUnit;
}) => {
  const { height, margin } = geometry;

  return (
    <g fill={series.ink} fontSize={AXIS_FONT_SIZE}>
      <text x={0} y={PIB_LINE_TITLE_Y} fontSize="12" fontWeight="600">
        {`R$ ${unit.label}`}
      </text>
      <line
        x1={margin.left}
        x2={margin.left}
        y1={margin.top}
        y2={height - margin.bottom}
        stroke={series.color}
      />
      {geometry.ticks.map((tick) => (
        <text
          key={tick.value}
          x={margin.left - 8}
          y={tick.y + 4}
          textAnchor="end"
        >
          {formatPibAxis(tick.value, unit)}
        </text>
      ))}
    </g>
  );
};

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

const ValueLabel = ({
  geometry,
  series,
}: {
  geometry: PibLineGeometry;
  series: PibLineSeries;
}) => {
  const { label } = geometry;

  return label ? (
    <text
      x={label.x}
      y={label.y}
      textAnchor={label.anchor}
      fontSize="13"
      fontWeight="700"
      fill={series.ink}
      stroke={PIB_COLORS.paper}
      strokeWidth="4"
      strokeLinejoin="round"
      paintOrder="stroke"
    >
      {formatPibReais(label.value)}
    </text>
  ) : null;
};

const Line = ({
  geometry,
  series,
  selectedIndex,
}: {
  geometry: PibLineGeometry;
  series: PibLineSeries;
  selectedIndex: number;
}) => (
  <g>
    <path
      d={linePath(geometry.points)}
      fill="none"
      stroke={series.color}
      strokeWidth="2.6"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    {geometry.points.map((point, index) => {
      const selected = index === selectedIndex;

      return (
        <circle
          key={index}
          cx={point.x.toFixed(1)}
          cy={point.y.toFixed(1)}
          r={selected ? 6 : geometry.narrow ? 2.5 : 3.2}
          fill={selected ? series.color : PIB_COLORS.paper}
          stroke={selected ? PIB_COLORS.paper : series.color}
          strokeWidth={selected ? 2.4 : 2}
        />
      );
    })}
    <ValueLabel geometry={geometry} series={series} />
  </g>
);

const LineSvg = ({
  geometry,
  seriesKey,
  svgRef,
  selectedIndex,
  ano,
  unit,
  ...handlers
}: LineYearHandlers & {
  geometry: PibLineGeometry;
  seriesKey: PibLineKey;
  svgRef?: Ref<SVGSVGElement>;
  unit: PibBarUnit;
  selectedIndex: number;
  ano: number;
}) => {
  const { width, height, years } = geometry;
  const series = SERIES[seriesKey];

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      height={height}
      role="group"
      aria-label={`${PIB_LINE_TITLES[seriesKey]}, ${years[0]?.year} a ${years[years.length - 1]?.year}`}
      fontFamily={PROTO_CHART_FONT}
      className="block w-full touch-pan-y overflow-visible [font-variant-numeric:tabular-nums]"
    >
      <Gridlines geometry={geometry} />
      <YearAxis geometry={geometry} />
      <ValueAxis geometry={geometry} series={series} unit={unit} />
      <Line geometry={geometry} series={series} selectedIndex={selectedIndex} />
      <ProtoYearSlider
        frame={geometry}
        years={years.map((year) => year.year)}
        ano={ano}
        focusClassName="focus-visible:stroke-(--proto-accent)"
        {...handlers}
      />
    </svg>
  );
};

/**
 * Gráfico de linha de uma série do PIB (`seriesKey`: o PIB total ou o per
 * capita), em SVG, com eixo próprio a partir de zero. Clique num ponto ou use
 * as setas para escolher o ano.
 *
 * @example <PibLineChart seriesKey="perCapita" serie={panel.serie} ano={2023} onSelectYear={pick} svgRef={chart.ref} />
 */
export const PibLineChart = ({
  seriesKey,
  serie,
  ano,
  onSelectYear,
  svgRef,
}: {
  seriesKey: PibLineKey;
  serie: PibYearPoint[];
  ano: number;
  onSelectYear: (ano: number) => void;
  svgRef?: Ref<SVGSVGElement>;
}) => {
  const { ref: boxRef, width: boxWidth } = useElementWidth();
  const years = useMemo(() => serie.map((point) => point.ano), [serie]);
  const unit = useMemo(
    () => pibLineUnits(serie)[seriesKey],
    [serie, seriesKey],
  );
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
        ? buildPibLineGeometry({
            width: boxWidth,
            serie,
            key: seriesKey,
            selectedIndex,
          })
        : null,
    [boxWidth, serie, seriesKey, selectedIndex],
  );
  const hoverPoint = hover && serie.find((point) => point.ano === hover.ano);
  const series = SERIES[seriesKey];

  return (
    <>
      {/* Reserva a altura final antes de medir a largura: sem salto na hidratação. */}
      <div className="@container">
        <div ref={boxRef} className={`relative ${PIB_LINE_HEIGHT_CLASS}`}>
          {geometry ? (
            <LineSvg
              geometry={geometry}
              seriesKey={seriesKey}
              svgRef={svgRef}
              selectedIndex={selectedIndex}
              ano={ano}
              unit={unit}
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
          rows={[
            {
              color: series.color,
              label: series.shortLabel,
              value: formatPibReais(series.pick(hoverPoint)),
            },
          ]}
        />
      ) : null}
    </>
  );
};

/**
 * Esqueleto do corpo do card com as alturas do gráfico pronto (gráfico e
 * dica), para o card não mudar de tamanho quando os dados chegam.
 *
 * @example <ProtoCard skeleton={<PibLineChartSkeleton />} … />
 */
export const PibLineChartSkeleton = () => (
  <>
    <div className="@container">
      <ProtoSkeleton className={PIB_LINE_HEIGHT_CLASS} />
    </div>
    <ProtoSkeleton className="mt-2 h-4 w-[40%]" />
  </>
);
