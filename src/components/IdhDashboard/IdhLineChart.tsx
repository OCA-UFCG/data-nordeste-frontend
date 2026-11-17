"use client";

import { type Ref, useMemo } from "react";
import { IDH_COLORS } from "@/components/IdhDashboard/idhColors";
import {
  type LineYearHandlers,
  ProtoYearSlider,
  useLineYear,
} from "@/components/ProtoPanel/ProtoLineYear";
import { ProtoTooltip } from "@/components/ProtoPanel/ProtoTooltip";
import {
  ProtoSeriesLegend,
  useHiddenSeries,
} from "@/components/ProtoPanel/ProtoSeriesLegend";
import { PROTO_CHART_FONT } from "@/components/ProtoPanel/protoStyles";
import { useElementWidth } from "@/components/ProtoPanel/useElementWidth";
import { formatIdh } from "@/features/panels/idh/idhFormat";
import {
  buildIdhLineGeometry,
  type IdhLineGeometry,
  linePath,
} from "@/features/panels/idh/idhLineChart";
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
      {geometry.selectedX === null ? null : (
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
      )}
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

const tooltipRows = (point: IdhYearPoint, hidden: Set<SeriesKey>) =>
  SERIES.filter((series) => !hidden.has(series.key)).map((series) => ({
    color: series.color,
    label: series.shortLabel,
    value: formatIdh(series.pick(point)),
  }));

// Folga da área de clique além do primeiro e do último ponto.
const HIT_PAD = { x: 10, bottom: 8 };

// Posição do ponteiro na área do gráfico vira o índice do ano mais próximo.

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
  const { hidden, toggle } = useHiddenSeries<SeriesKey>();
  const years = useMemo(() => serie.map((point) => point.ano), [serie]);
  const { selectedIndex, hover, handlers } = useLineYear({
    years,
    ano,
    onSelectYear,
    hitPad: HIT_PAD.x,
  });

  // PERF: o tooltip muda a cada movimento do ponteiro; a geometria só muda
  // com a largura, a série ou o ano.
  const geometry = useMemo(
    () =>
      boxWidth && serie.length
        ? buildIdhLineGeometry({
            width: boxWidth,
            years,
            series: SERIES.map((series) => ({
              key: series.key,
              labelOffset: series.labelOffset,
              values: serie.map(series.pick),
            })),
            selectedIndex,
          })
        : null,
    [boxWidth, serie, years, selectedIndex],
  );
  const hoverPoint = hover && serie.find((point) => point.ano === hover.ano);

  return (
    <>
      <ProtoSeriesLegend series={SERIES} hidden={hidden} onToggle={toggle} />
      <div ref={boxRef} className="relative min-h-[280px]">
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

const LineSvg = ({
  geometry,
  svgRef,
  hidden,
  selectedIndex,
  ano,
  ...handlers
}: LineYearHandlers & {
  geometry: IdhLineGeometry;
  svgRef?: Ref<SVGSVGElement>;
  hidden: Set<SeriesKey>;
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
      <ProtoYearSlider
        frame={geometry}
        years={years.map((year) => year.year)}
        ano={ano}
        pad={HIT_PAD}
        focusClassName="focus-visible:stroke-[#7c46e1]"
        {...handlers}
      />
    </svg>
  );
};
