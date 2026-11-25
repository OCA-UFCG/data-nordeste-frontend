"use client";

import { type Ref, useState } from "react";
import type { AridezCardProps } from "@/components/AridezDashboard/aridezCardProps";
import { AridezClassLegend } from "@/components/AridezDashboard/AridezClassLegend";
import { AridezIndexInfo } from "@/components/AridezDashboard/AridezIndexInfo";
import { ARIDEZ_CARD_INFO } from "@/components/AridezDashboard/aridezTexts";
import { ARIDEZ_COLORS } from "@/components/AridezDashboard/aridezTheme";
import { ProtoCard } from "@/components/ProtoPanel/ProtoCard";
import { ProtoCardInfo } from "@/components/ProtoPanel/ProtoCardInfo";
import {
  ProtoCardMenu,
  useSvgChart,
} from "@/components/ProtoPanel/ProtoCardMenu";
import { PROTO_CHART_FONT } from "@/components/ProtoPanel/protoStyles";
import {
  ProtoTooltip,
  type TooltipAt,
} from "@/components/ProtoPanel/ProtoTooltip";
import { useElementWidth } from "@/components/ProtoPanel/useElementWidth";
import { EMPTY_ARIDEZ_AREAS } from "@/features/panels/aridez/aridezClasses";
import {
  buildAridezColumns,
  type AridezColumn,
  type AridezColumns,
} from "@/features/panels/aridez/aridezColumns";
import {
  formatAreaCompact,
  formatAreaKm2,
  formatAreaTick,
  formatSharePercent,
} from "@/features/panels/aridez/aridezFormat";

const TITLE = "Índice de aridez (km²)";

// Medidas do `drawCls` do protótipo; abaixo de 440 px some o rótulo do eixo X
// (a legenda acima já diz qual é cada cor). A altura acompanha o card (que se
// estica até a lista de municípios ao lado), com o mínimo do protótipo.
const frameFor = (width: number, boxHeight: number) => {
  const narrow = width < 440;
  const margin = { left: narrow ? 46 : 56, right: 10, top: 26 };
  const height = Math.max(narrow ? 250 : 290, Math.round(boxHeight));
  const bottom = narrow ? 12 : 32;

  return {
    narrow,
    width,
    height,
    left: margin.left,
    top: margin.top,
    innerWidth: width - margin.left - margin.right,
    innerHeight: height - margin.top - bottom,
  };
};

type Frame = ReturnType<typeof frameFor>;

type ColumnHover = { index: number } & TooltipAt;

const Gridlines = ({ frame, chart }: { frame: Frame; chart: AridezColumns }) =>
  chart.axis.ticks.map((tick, index) => {
    const y = frame.top + frame.innerHeight * (1 - index / 4);

    return (
      <g key={tick}>
        <line
          x1={frame.left}
          x2={frame.left + frame.innerWidth}
          y1={y}
          y2={y}
          stroke={ARIDEZ_COLORS.grid}
        />
        <text
          x={frame.left - 8}
          y={y + 4}
          textAnchor="end"
          fontSize="11"
          fill={ARIDEZ_COLORS.muted}
        >
          {formatAreaTick(tick, chart.unit)}
        </text>
      </g>
    );
  });

const Column = ({
  column,
  index,
  frame,
  chart,
  onHover,
}: {
  column: AridezColumn;
  index: number;
  frame: Frame;
  chart: AridezColumns;
  onHover: (hover: ColumnHover | null) => void;
}) => {
  const slot = frame.innerWidth / 4;
  const barWidth = Math.min(64, slot * 0.58);
  const center = frame.left + slot * (index + 0.5);
  const height = Math.max(
    column.area > 0 ? 2 : 0,
    column.height * frame.innerHeight,
  );
  const top = frame.top + frame.innerHeight - height;
  const hover = (event: { clientX: number; clientY: number }) =>
    onHover({ index, x: event.clientX, y: event.clientY });

  return (
    <g>
      <rect
        x={center - barWidth / 2}
        y={top}
        width={barWidth}
        height={height}
        rx="2"
        fill={column.item.color}
        stroke={
          column.item.key === "subumido"
            ? ARIDEZ_COLORS.subumidoEdge
            : undefined
        }
        role="img"
        aria-label={`${column.item.label}: ${formatAreaKm2(column.area)}, ${formatSharePercent(column.percent)} da área`}
        onPointerEnter={hover}
        onPointerMove={hover}
        onPointerLeave={() => onHover(null)}
      />
      <text
        x={center}
        y={top - 7}
        textAnchor="middle"
        fontSize="12.5"
        fontWeight="700"
        fill={ARIDEZ_COLORS.ink}
      >
        {column.area > 0 ? formatAreaCompact(column.area, chart.unit) : "0"}
      </text>
      {frame.narrow ? null : (
        <text
          x={center}
          y={frame.height - 10}
          textAnchor="middle"
          fontSize="11"
          fill={ARIDEZ_COLORS.muted}
        >
          {column.item.label}
        </text>
      )}
    </g>
  );
};

const ColumnsSvg = ({
  frame,
  chart,
  svgRef,
  onHover,
}: {
  frame: Frame;
  chart: AridezColumns;
  svgRef: Ref<SVGSVGElement>;
  onHover: (hover: ColumnHover | null) => void;
}) => (
  <svg
    ref={svgRef}
    viewBox={`0 0 ${frame.width} ${frame.height}`}
    width={frame.width}
    height={frame.height}
    className="absolute inset-0"
    role="group"
    aria-label="Área por classe do índice de aridez, em km²"
    fontFamily={PROTO_CHART_FONT}
  >
    <Gridlines frame={frame} chart={chart} />
    {chart.columns.map((column, index) => (
      <Column
        key={column.item.key}
        column={column}
        index={index}
        frame={frame}
        chart={chart}
        onHover={onHover}
      />
    ))}
    <line
      x1={frame.left}
      x2={frame.left + frame.innerWidth}
      y1={frame.top + frame.innerHeight}
      y2={frame.top + frame.innerHeight}
      stroke={ARIDEZ_COLORS.axis}
    />
  </svg>
);

const ColumnTooltip = ({
  hover,
  chart,
}: {
  hover: ColumnHover;
  chart: AridezColumns;
}) => {
  const column = chart.columns[hover.index];

  return (
    <ProtoTooltip
      at={hover}
      title={column.item.label}
      rows={[
        {
          color: column.item.color,
          label: "Área",
          value: formatAreaKm2(column.area),
        },
        {
          color: "transparent",
          label: "Participação",
          value: formatSharePercent(column.percent),
        },
      ]}
    />
  );
};

// IMPORTANT: a medida fica num filho, dentro do corpo do card. Com o hook no
// card, o corpo remontava (carregando → ok) e a div nova não era observada: no
// celular o gráfico ficava com largura 0, sem desenhar.
const MeasuredColumns = ({
  columns,
  svgRef,
}: {
  columns: AridezColumns;
  svgRef: Ref<SVGSVGElement>;
}) => {
  const { ref, width, height } = useElementWidth();
  const [hover, setHover] = useState<ColumnHover | null>(null);

  // `#c-cls .chartbox` do protótipo: a caixa cresce (flex-1) e o SVG fica
  // absoluto dentro dela, para não empurrar a própria altura medida.
  return (
    <div ref={ref} className="relative mt-2 min-h-[260px] w-full flex-1">
      {width ? (
        <ColumnsSvg
          frame={frameFor(Math.max(280, width), height)}
          chart={columns}
          svgRef={svgRef}
          onHover={setHover}
        />
      ) : null}
      {hover ? <ColumnTooltip hover={hover} chart={columns} /> : null}
    </div>
  );
};

/**
 * Card "Índice de aridez (km²)": uma coluna por classe com a área do
 * território no ano, do árido ao úmido.
 *
 * @example <AridezClassCard data={panel} place="Nordeste · Pernambuco" state="ok" onRetry={retry} />
 */
export const AridezClassCard = ({
  data,
  place,
  ...status
}: AridezCardProps) => {
  const chart = useSvgChart();
  const columns = buildAridezColumns(data.areas ?? EMPTY_ARIDEZ_AREAS);

  return (
    <ProtoCard
      {...status}
      title={TITLE}
      subtitle={`${place} · ${data.filters.ano} · área por classe`}
      kind="line"
      bodyClassName="flex flex-col"
      actions={
        <>
          <ProtoCardInfo
            title={TITLE}
            text={<AridezIndexInfo lead={ARIDEZ_CARD_INFO.classes} />}
          />
          <ProtoCardMenu title={TITLE} chart={chart} />
        </>
      }
    >
      <AridezClassLegend />
      <MeasuredColumns columns={columns} svgRef={chart.ref} />
    </ProtoCard>
  );
};
