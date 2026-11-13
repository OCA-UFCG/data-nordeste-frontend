"use client";

import { type Ref, useState } from "react";
import type { PerfilCardProps } from "@/components/DemografiaDashboard/perfilCardProps";
import { ProtoCard } from "@/components/ProtoPanel/ProtoCard";
import { ProtoCardInfo } from "@/components/ProtoPanel/ProtoCardInfo";
import {
  ProtoCardMenu,
  useSvgChart,
} from "@/components/ProtoPanel/ProtoCardMenu";
import {
  ProtoTooltip,
  type TooltipAt,
} from "@/components/ProtoPanel/ProtoTooltip";
import { PROTO_CHART_FONT } from "@/components/ProtoPanel/protoStyles";
import { useElementWidth } from "@/components/ProtoPanel/useElementWidth";
import {
  buildSerieGeometry,
  type SerieGeometry,
} from "@/features/panels/demografia/perfilCharts";
import { formatPessoas } from "@/features/panels/format";

const TITLE = "Série temporal da população";
const INFO =
  "População residente do território nos Censos Demográficos de 2000, 2010 e 2022.";

// SVG leva cor literal: a imagem baixada não enxerga as variáveis CSS do painel.
const INK = "#a8264f";

const SerieGrid = ({ geometry }: { geometry: SerieGeometry }) => (
  <>
    {geometry.gridLines.map((line) => (
      <g key={line.label}>
        <line
          x1={geometry.grid.x1}
          x2={geometry.grid.x2}
          y1={line.y}
          y2={line.y}
          stroke="#e6e3e4"
        />
        <text
          x={geometry.axisLabelX}
          y={line.y + 4}
          fontSize={12}
          fill="#595557"
          textAnchor="end"
        >
          {line.label}
        </text>
      </g>
    ))}
  </>
);

type SerieHover = { index: number } & TooltipAt;

const SeriePoints = ({
  geometry,
  hovered,
  onHover,
}: {
  geometry: SerieGeometry;
  hovered: number | null;
  onHover: (hover: SerieHover | null) => void;
}) => (
  <>
    {geometry.points.map((point, index) => (
      <g key={point.ano}>
        <text
          x={point.x}
          y={point.y - 14}
          textAnchor="middle"
          fontSize={13}
          fontWeight={600}
          fill="#292829"
        >
          {point.label}
        </text>
        <text
          x={point.x}
          y={geometry.yearLabelY}
          textAnchor="middle"
          fontSize={13}
          fontWeight={500}
          fill="#595557"
        >
          {point.ano}
        </text>
        <circle
          cx={point.x}
          cy={point.y}
          r={6}
          fill="#ffffff"
          stroke={INK}
          strokeWidth={hovered === index ? 4 : 2.4}
          onPointerEnter={(event) =>
            onHover({ index, x: event.clientX, y: event.clientY })
          }
          onPointerMove={(event) =>
            onHover({ index, x: event.clientX, y: event.clientY })
          }
          onPointerLeave={() => onHover(null)}
        />
      </g>
    ))}
  </>
);

// Tamanho e cor fixos: o `svg` sai igual na tela e na imagem baixada.
const SerieSvg = ({
  geometry,
  svgRef,
  hovered,
  onHover,
  label,
}: {
  geometry: SerieGeometry;
  svgRef: Ref<SVGSVGElement>;
  hovered: number | null;
  onHover: (hover: SerieHover | null) => void;
  label: string;
}) => (
  <svg
    ref={svgRef}
    viewBox={`0 0 ${geometry.width} ${geometry.height}`}
    height={geometry.height}
    role="group"
    aria-label={label}
    fontFamily={PROTO_CHART_FONT}
    className="block w-full overflow-visible [font-variant-numeric:tabular-nums]"
  >
    <SerieGrid geometry={geometry} />
    <path
      d={geometry.path}
      fill="none"
      stroke={INK}
      strokeWidth={2.6}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    <SeriePoints geometry={geometry} hovered={hovered} onHover={onHover} />
  </svg>
);

const SerieChart = ({
  data,
  svgRef,
}: {
  data: PerfilCardProps["data"];
  svgRef: Ref<SVGSVGElement>;
}) => {
  const { ref, width } = useElementWidth();
  const [hover, setHover] = useState<SerieHover | null>(null);
  const points = data.serie.map((point) => ({
    ano: Number(point.label),
    valor: point.value,
  }));
  const geometry =
    width && points.length ? buildSerieGeometry({ width, points }) : null;
  const hovered = geometry && hover ? geometry.points[hover.index] : null;

  return (
    <div ref={ref} className="relative min-h-[250px]">
      {geometry ? (
        <SerieSvg
          geometry={geometry}
          svgRef={svgRef}
          hovered={hover?.index ?? null}
          onHover={setHover}
          label={`${TITLE}, ${points[0]?.ano} a ${points[points.length - 1]?.ano}`}
        />
      ) : null}
      {hover && hovered ? (
        <ProtoTooltip
          at={hover}
          title={String(hovered.ano)}
          rows={[
            {
              color: INK,
              label: "População",
              value: `${formatPessoas(hovered.valor)} habitantes`,
            },
          ]}
        />
      ) : null}
    </div>
  );
};

/**
 * Card "Série temporal da população": a população do território nos censos,
 * em linha. Passar o mouse num ponto mostra o ano e o total.
 *
 * @example <PerfilSerieCard data={panel} place="Nordeste" state="ok" onRetry={retry} />
 */
export const PerfilSerieCard = (props: PerfilCardProps) => {
  const chart = useSvgChart();

  return (
    <ProtoCard
      title={TITLE}
      subtitle={props.place}
      kind="line"
      state={props.state}
      onRetry={props.onRetry}
      actions={
        <>
          <ProtoCardInfo title={TITLE} text={INFO} />
          <ProtoCardMenu title={TITLE} chart={chart} />
        </>
      }
    >
      <SerieChart data={props.data} svgRef={chart.ref} />
    </ProtoCard>
  );
};
