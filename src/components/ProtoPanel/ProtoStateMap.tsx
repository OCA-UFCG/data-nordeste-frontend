"use client";

import type { KeyboardEvent, Ref } from "react";
import {
  PROTO_CHART_FONT,
  PROTO_INK,
  PROTO_INK_STRONG,
} from "@/components/ProtoPanel/protoStyles";
import {
  STATE_LABELS,
  STATE_MAP_BOX,
  STATE_PATHS,
} from "@/features/panels/stateShapes";

// O escolhido vai por último: o contorno grosso dele fica por cima dos vizinhos.
const drawOrder = (selectedUf?: string) => {
  const codes = Object.keys(STATE_PATHS);

  return selectedUf && codes.includes(selectedUf)
    ? [...codes.filter((code) => code !== selectedUf), selectedUf]
    : codes;
};

const StatePath = ({
  code,
  fill,
  label,
  selectable,
  selected,
  fullscreen,
  onSelect,
}: {
  code: string;
  fill: string;
  label: string;
  selectable: boolean;
  selected: boolean;
  fullscreen: boolean;
  onSelect: (code: string) => void;
}) => {
  // Sem `selectable` a tecla ainda chama onSelect: um estado sem dado pode
  // receber o foco por clique, como antes.
  const handleKeyDown = (event: KeyboardEvent<SVGPathElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect(code);
  };

  return (
    <path
      d={STATE_PATHS[code]}
      fill={fill}
      stroke={selected ? PROTO_INK : "#ffffff"}
      strokeWidth={selected ? 3 : 1.4}
      vectorEffect={fullscreen ? "non-scaling-stroke" : undefined}
      tabIndex={selectable ? 0 : -1}
      role="button"
      aria-pressed={selected}
      aria-label={label}
      onClick={() => selectable && onSelect(code)}
      onKeyDown={handleKeyDown}
      className="cursor-pointer transition-opacity duration-100 hover:opacity-85 focus-visible:outline-[2.5px] focus-visible:outline-(--proto-accent)"
    >
      {fullscreen ? <title>{label}</title> : null}
    </path>
  );
};

/**
 * Props do mapa por estado: quem decide a cor, o texto e se o estado escolhe
 * (`isSelectable`) fica com o painel; o mapa cuida só do desenho e do toque.
 */
export type ProtoStateMapProps = {
  fillFor: (code: string) => string;
  describe: (code: string) => string;
  isSelectable: (code: string) => boolean;
  label: string;
  selectedUf?: string;
  onSelect: (code: string) => void;
};

/**
 * Mapa por estado (`.map-box` do protótipo): os estados na cor que
 * `fillFor` der, com a sigla. Clicar num estado selecionável escolhe ou desfaz
 * o filtro.
 *
 * @example <ProtoStateMap fillFor={(code) => "#35b2db"} describe={(code) => code} isSelectable={() => true} label="Mapa" selectedUf="PE" onSelect={toggleUf} />
 */
export const ProtoStateMap = ({
  fillFor,
  describe,
  isSelectable,
  label,
  selectedUf,
  onSelect,
  svgRef,
  viewBox,
  fullscreen = false,
  className = "mx-auto block max-h-[520px] w-full",
}: ProtoStateMapProps & {
  svgRef?: Ref<SVGSVGElement>;
  viewBox?: string;
  fullscreen?: boolean;
  className?: string;
}) => (
  <svg
    ref={svgRef}
    viewBox={viewBox ?? `0 0 ${STATE_MAP_BOX.width} ${STATE_MAP_BOX.height}`}
    preserveAspectRatio="xMidYMid meet"
    role="group"
    aria-label={label}
    fontFamily={PROTO_CHART_FONT}
    className={className}
  >
    {drawOrder(selectedUf).map((code) => (
      <StatePath
        key={code}
        code={code}
        fill={fillFor(code)}
        label={describe(code)}
        selectable={isSelectable(code)}
        selected={code === selectedUf}
        fullscreen={fullscreen}
        onSelect={onSelect}
      />
    ))}
    {Object.entries(STATE_LABELS).map(([code, [x, y]]) => (
      <text
        key={code}
        x={x}
        y={y + 5}
        textAnchor="middle"
        fontSize="14"
        fontWeight="600"
        fill={PROTO_INK_STRONG}
        stroke="#ffffff"
        strokeWidth="3"
        paintOrder="stroke"
        pointerEvents="none"
      >
        {code}
      </text>
    ))}
  </svg>
);
