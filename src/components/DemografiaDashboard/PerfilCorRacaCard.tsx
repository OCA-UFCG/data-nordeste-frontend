"use client";

import { type Ref, useState } from "react";
import type { PerfilCardProps } from "@/components/DemografiaDashboard/perfilCardProps";
import { ProtoCard } from "@/components/ProtoPanel/ProtoCard";
import { ProtoCardInfo } from "@/components/ProtoPanel/ProtoCardInfo";
import {
  ProtoCardMenu,
  useSvgChart,
} from "@/components/ProtoPanel/ProtoCardMenu";
import { ProtoIcon } from "@/components/ProtoPanel/ProtoIcon";
import {
  ProtoTooltip,
  type TooltipAt,
} from "@/components/ProtoPanel/ProtoTooltip";
import { PROTO_CHART_FONT } from "@/components/ProtoPanel/protoStyles";
import { useElementWidth } from "@/components/ProtoPanel/useElementWidth";
import { describeCorRaca } from "@/features/panels/demografia/demografiaAnalise";
import {
  buildCorRacaGeometry,
  type CorRacaGeometry,
} from "@/features/panels/demografia/perfilCharts";

const TITLE = "População por cor ou raça";
const INFO =
  "População residente por cor ou raça, conforme a autodeclaração registrada no Censo Demográfico.";

// Literais: a imagem baixada não enxerga as variáveis CSS do painel.
const BAR = "#e484aa";
const BAR_HOVER = "#d6537f";
const BASELINE = "#bdbabc";

type CorRacaHover = { index: number } & TooltipAt;

const CorRacaBars = ({
  geometry,
  hovered,
  onHover,
}: {
  geometry: CorRacaGeometry;
  hovered: number | null;
  onHover: (hover: CorRacaHover | null) => void;
}) => (
  <>
    <line
      x1={geometry.baseline.x1}
      x2={geometry.baseline.x2}
      y1={geometry.base}
      y2={geometry.base}
      stroke={BASELINE}
      strokeWidth={1.5}
    />
    {geometry.bars.map((bar, index) => (
      <g key={bar.label}>
        <rect
          x={bar.barX}
          y={bar.barY}
          width={bar.barWidth}
          height={bar.barHeight}
          fill={hovered === index ? BAR_HOVER : BAR}
          onPointerEnter={(event) =>
            onHover({ index, x: event.clientX, y: event.clientY })
          }
          onPointerMove={(event) =>
            onHover({ index, x: event.clientX, y: event.clientY })
          }
          onPointerLeave={() => onHover(null)}
        />
        <text
          x={bar.x}
          y={bar.barY - 7}
          textAnchor="middle"
          fontSize={13}
          fontWeight={600}
          fill="#292829"
        >
          {bar.valueLabel}
        </text>
        <text
          x={bar.x}
          y={geometry.base + 22}
          textAnchor="middle"
          fontSize={13}
          fontWeight={500}
          fill="#292829"
        >
          {bar.label}
        </text>
      </g>
    ))}
  </>
);

const CorRacaChart = ({
  data,
  svgRef,
}: {
  data: PerfilCardProps["data"];
  svgRef: Ref<SVGSVGElement>;
}) => {
  const { ref, width } = useElementWidth();
  const [hover, setHover] = useState<CorRacaHover | null>(null);
  const geometry =
    width && data.corRaca.length
      ? buildCorRacaGeometry({ width, bars: data.corRaca })
      : null;
  const hovered = geometry && hover ? geometry.bars[hover.index] : null;

  return (
    <div ref={ref} className="relative min-h-[250px]">
      {geometry ? (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          height={geometry.height}
          role="group"
          aria-label={TITLE}
          fontFamily={PROTO_CHART_FONT}
          className="block w-full overflow-visible [font-variant-numeric:tabular-nums]"
        >
          <CorRacaBars
            geometry={geometry}
            hovered={hover?.index ?? null}
            onHover={setHover}
          />
        </svg>
      ) : null}
      {hover && hovered ? (
        <ProtoTooltip
          at={hover}
          title={hovered.label}
          rows={[
            {
              color: BAR,
              label: "População",
              value: `${hovered.valueLabel} de pessoas`,
            },
          ]}
        />
      ) : null}
    </div>
  );
};

// `.cor-note`: a leitura do censo, uma linha por parágrafo.
const CorRacaNote = ({ lines }: { lines: string[] }) => (
  <div className="cor-note mt-2.5 flex gap-2 text-[11.5px] leading-[17px] text-grey-800">
    <ProtoIcon
      name="infoS"
      size={16}
      stroke={2.2}
      className="mt-px flex-none"
    />
    <div>
      {lines.map((line) => (
        <p key={line} className="mb-1">
          {line}
        </p>
      ))}
    </div>
  </div>
);

/**
 * Card "População por cor ou raça": colunas por cor ou raça, com a leitura
 * do censo (a mais declarada e a variação desde o censo anterior) embaixo.
 *
 * @example <PerfilCorRacaCard data={panel} place="Nordeste" state="ok" onRetry={retry} />
 */
export const PerfilCorRacaCard = (props: PerfilCardProps) => {
  const chart = useSvgChart();
  const { data } = props;
  const lines = describeCorRaca(data.corRaca, data.corRacaAnterior);

  return (
    <ProtoCard
      title={TITLE}
      subtitle={`${props.place} · ${data.filters.ano}`}
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
      <CorRacaChart data={data} svgRef={chart.ref} />
      {lines.length ? <CorRacaNote lines={lines} /> : null}
    </ProtoCard>
  );
};
