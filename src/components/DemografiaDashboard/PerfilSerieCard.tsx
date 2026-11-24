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
  serieMinHeight,
  type SerieGeometry,
} from "@/features/panels/demografia/perfilCharts";
import { formatPessoas } from "@/features/panels/format";

const TITLE = "Dinâmica populacional";

const CENSOS = new Intl.ListFormat("pt-BR", { type: "conjunction" });

// Os censos citados são os da série que veio do banco.
const censosText = (serie: PerfilCardProps["data"]["serie"]) => {
  if (!serie.length) {
    return "População residente do território nos Censos Demográficos (sem dados disponíveis).";
  }

  return `População residente do território nos Censos Demográficos de ${CENSOS.format(serie.map((point) => point.label))}.`;
};

const infoText = (serie: PerfilCardProps["data"]["serie"]) => (
  <>
    <p>{censosText(serie)}</p>
    <p>
      Alguns municípios foram criados a partir do desmembramento de outros, o
      que explica a ausência de dados individualizados para esses municípios em
      censos demográficos anteriores à sua criação. Essas alterações
      territoriais devem ser consideradas na análise e na comparação dos dados
      populacionais ao longo do tempo.
    </p>
  </>
);

// SVG leva cor literal: a imagem baixada não enxerga as variáveis CSS do painel.
const BAR = "#e484aa";
const BAR_HOVER = "#d6537f";
const BASELINE = "#bdbabc";

const SerieGrid = ({ geometry }: { geometry: SerieGeometry }) => (
  <>
    {geometry.gridLines.map((line) => (
      <g key={line.y}>
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

const SerieBars = ({
  geometry,
  hovered,
  onHover,
}: {
  geometry: SerieGeometry;
  hovered: number | null;
  onHover: (hover: SerieHover | null) => void;
}) => (
  <>
    <line
      x1={geometry.grid.x1}
      x2={geometry.grid.x2}
      y1={geometry.base}
      y2={geometry.base}
      stroke={BASELINE}
      strokeWidth={1.5}
    />
    {geometry.bars.map((bar, index) => (
      <g key={bar.ano}>
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
          {bar.label}
        </text>
        <text
          x={bar.x}
          y={geometry.yearLabelY}
          textAnchor="middle"
          fontSize={13}
          fontWeight={500}
          fill="#595557"
        >
          {bar.ano}
        </text>
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
    className="absolute inset-x-0 top-0 block w-full overflow-visible [font-variant-numeric:tabular-nums]"
  >
    <SerieGrid geometry={geometry} />
    <SerieBars geometry={geometry} hovered={hovered} onHover={onHover} />
  </svg>
);

const SerieChart = ({
  data,
  svgRef,
}: {
  data: PerfilCardProps["data"];
  svgRef: Ref<SVGSVGElement>;
}) => {
  const { ref, width, height } = useElementWidth();
  const [hover, setHover] = useState<SerieHover | null>(null);
  const points = data.serie.map((point) => ({
    ano: Number(point.label),
    valor: point.value,
  }));
  const geometry =
    width && points.length
      ? buildSerieGeometry({ width, height, points })
      : null;
  const hovered = geometry && hover ? geometry.bars[hover.index] : null;

  // Ao lado de "cor ou raça" (acima de 1000 px) o card é mais alto que o
  // gráfico: a caixa estica (`flex-1`) e o SVG ocupa a altura que sobrar. O SVG
  // fica fora do fluxo (`absolute`) para não segurar a caixa alta quando o
  // gráfico encolhe; o piso é a altura do protótipo.
  return (
    <div
      ref={ref}
      style={{ minHeight: serieMinHeight(width) }}
      className="relative flex-1"
    >
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
              color: BAR,
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
 * Card "Dinâmica populacional": a população do território nos censos,
 * em colunas. Passar o mouse numa coluna mostra o ano e o total.
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
      bodyClassName="flex flex-col"
      actions={
        <>
          <ProtoCardInfo title={TITLE} text={infoText(props.data.serie)} />
          <ProtoCardMenu title={TITLE} chart={chart} />
        </>
      }
    >
      <SerieChart data={props.data} svgRef={chart.ref} />
    </ProtoCard>
  );
};
