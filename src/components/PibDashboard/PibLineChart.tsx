"use client";

import { type Ref, useMemo } from "react";
import { PIB_LINE_TITLE } from "@/components/PibDashboard/pibTexts";
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
  type PibLineGeometry,
  type PibLineKey,
  pibLineUnits,
} from "@/features/panels/pib/pibLineChart";
import type { PibYearPoint } from "@/features/panels/pib/pibPanel";
import { linePath } from "@/features/panels/svgPath";

type PibLineSeries = {
  key: PibLineKey;
  shortLabel: string;
  color: string;
  ink: string;
  pick: (point: PibYearPoint) => number;
};

const SERIES: readonly PibLineSeries[] = [
  {
    key: "pib",
    shortLabel: "PIB total",
    color: PIB_COLORS.total,
    ink: PIB_COLORS.totalInk,
    pick: (point) => point.pib,
  },
  {
    key: "perCapita",
    shortLabel: "PIB per capita",
    color: PIB_COLORS.perCapita,
    ink: PIB_COLORS.perCapitaInk,
    pick: (point) => point.perCapita,
  },
];

const AXIS_FONT_SIZE = "11.5";

// Título do eixo: "PIB total (R$ bilhões)".
const seriesTitle = (series: PibLineSeries, unit: PibBarUnit) =>
  `${series.shortLabel} (R$ ${unit.label})`;

type Units = Record<PibLineKey, PibBarUnit>;

// Altura do gráfico e do esqueleto: PIB_LINE_HEIGHT acima de PIB_LINE_NARROW_WIDTH.
export const PIB_LINE_HEIGHT_CLASS = "min-h-[320px] @[560px]:min-h-[360px]";

const Gridlines = ({ geometry }: { geometry: PibLineGeometry }) => (
  <>
    {geometry.ticks.map((tick) => (
      <line
        key={tick.pib}
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

// Traço com ponto antes do título no cabeçalho do celular: diz qual linha é
// de qual eixo, já que os títulos saem da ponta de cada eixo.
const SeriesMarker = ({ series, y }: { series: PibLineSeries; y: number }) => (
  <g stroke={series.color} strokeWidth="2.6" strokeLinecap="round">
    <line x1="1.5" x2="12.5" y1={y - 4} y2={y - 4} />
    <circle cx="7" cy={y - 4} r="2.5" fill={PIB_COLORS.paper} strokeWidth="2" />
  </g>
);

// Valor do ano escolhido no cabeçalho do celular, no lugar do rótulo sobre a
// linha (que lá cobria a outra série).
const Readout = ({
  geometry,
  series,
}: {
  geometry: PibLineGeometry;
  series: PibLineSeries;
}) => {
  const readout = geometry.readouts?.[series.key];

  return readout ? (
    <text
      x={readout.x}
      y={readout.y}
      textAnchor="end"
      fontSize="13"
      fontWeight="700"
      fill={series.ink}
    >
      {formatPibReais(readout.value)}
    </text>
  ) : null;
};

// Título, marcas e linha de um eixo, na cor da série (texto na tinta escura,
// que passa o contraste AA no branco).
const ValueAxis = ({
  geometry,
  series,
  unit,
}: {
  geometry: PibLineGeometry;
  series: PibLineSeries;
  unit: PibBarUnit;
}) => {
  const { width, height, margin } = geometry;
  const left = series.key === "pib";
  const axisX = left ? margin.left : width - margin.right;
  const title = geometry.titles[series.key];

  return (
    <g fill={series.ink} fontSize={AXIS_FONT_SIZE}>
      {geometry.narrow ? <SeriesMarker series={series} y={title.y} /> : null}
      <text
        x={title.x}
        y={title.y}
        textAnchor={title.anchor}
        fontSize="12"
        fontWeight="600"
      >
        {seriesTitle(series, unit)}
      </text>
      <line
        x1={axisX}
        x2={axisX}
        y1={margin.top}
        y2={height - margin.bottom}
        stroke={series.color}
      />
      {geometry.ticks.map((tick) => (
        <text
          key={tick.pib}
          x={left ? axisX - 8 : axisX + 8}
          y={tick.y + 4}
          textAnchor={left ? "end" : "start"}
        >
          {formatPibAxis(left ? tick.pib : tick.perCapita, unit)}
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
            fill={selected ? series.color : PIB_COLORS.paper}
            stroke={selected ? PIB_COLORS.paper : series.color}
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
          stroke={PIB_COLORS.paper}
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
  selectedIndex,
  ano,
  units,
  ...handlers
}: LineYearHandlers & {
  geometry: PibLineGeometry;
  svgRef?: Ref<SVGSVGElement>;
  units: Units;
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
      aria-label={`${PIB_LINE_TITLE}, ${years[0]?.year} a ${years[years.length - 1]?.year}`}
      fontFamily={PROTO_CHART_FONT}
      className="block w-full touch-pan-y overflow-visible [font-variant-numeric:tabular-nums]"
    >
      <Gridlines geometry={geometry} />
      <YearAxis geometry={geometry} />
      {SERIES.map((series) => (
        <ValueAxis
          key={series.key}
          geometry={geometry}
          series={series}
          unit={units[series.key]}
        />
      ))}
      {SERIES.map((series) => (
        <Readout key={series.key} geometry={geometry} series={series} />
      ))}
      {SERIES.map((series) => (
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
        focusClassName="focus-visible:stroke-(--proto-accent)"
        {...handlers}
      />
    </svg>
  );
};

const tooltipRows = (point: PibYearPoint) =>
  SERIES.map((series) => ({
    color: series.color,
    label: series.shortLabel,
    value: formatPibReais(series.pick(point)),
  }));

/**
 * Gráfico "Dinâmica temporal do PIB" (`#lineBox` do protótipo), em SVG: PIB
 * total e per capita, cada um com o seu eixo, título e unidade, sem legenda.
 * Clique num ponto ou use as setas para escolher o ano.
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
  const years = useMemo(() => serie.map((point) => point.ano), [serie]);
  const units = useMemo(() => pibLineUnits(serie), [serie]);
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
      {/* Reserva a altura final antes de medir a largura: sem salto na hidratação. */}
      <div className="@container">
        <div ref={boxRef} className={`relative ${PIB_LINE_HEIGHT_CLASS}`}>
          {geometry ? (
            <LineSvg
              geometry={geometry}
              svgRef={svgRef}
              selectedIndex={selectedIndex}
              ano={ano}
              units={units}
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
          rows={tooltipRows(hoverPoint)}
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
