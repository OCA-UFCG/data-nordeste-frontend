"use client";

import type { KeyboardEvent, Ref } from "react";
import {
  IDH_CHART_FONT,
  IDH_COLORS,
} from "@/components/IdhDashboard/idhStyles";
import type { ChoroplethRegion } from "@/features/panels/chartOptions";
import { buildIdhLegend, idhClassFor } from "@/features/panels/idh/idhClasses";
import { formatIdh } from "@/features/panels/idh/idhFormat";
import {
  IDH_MAP_BOX,
  IDH_STATE_LABELS,
  IDH_STATE_PATHS,
} from "@/features/panels/idh/idhStateShapes";

const NO_DATA_FILL = "#e3e1e2";

// O escolhido vai por último: o contorno grosso dele fica por cima dos vizinhos.
const drawOrder = (selectedUf?: string) => {
  const codes = Object.keys(IDH_STATE_PATHS);

  return selectedUf && codes.includes(selectedUf)
    ? [...codes.filter((code) => code !== selectedUf), selectedUf]
    : codes;
};

const describeState = (code: string, region?: ChoroplethRegion) =>
  region
    ? `${region.name}, IDH ${formatIdh(region.value)}, ${idhClassFor(region.value).label}`
    : `${code}, sem dado`;

const StatePath = ({
  code,
  region,
  selected,
  fullscreen,
  onSelect,
}: {
  code: string;
  region?: ChoroplethRegion;
  selected: boolean;
  fullscreen: boolean;
  onSelect: (code: string) => void;
}) => {
  const handleKeyDown = (event: KeyboardEvent<SVGPathElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect(code);
  };

  return (
    <path
      d={IDH_STATE_PATHS[code]}
      fill={region ? idhClassFor(region.value).color : NO_DATA_FILL}
      stroke={selected ? IDH_COLORS.ink : "#ffffff"}
      strokeWidth={selected ? 3 : 1.4}
      vectorEffect={fullscreen ? "non-scaling-stroke" : undefined}
      tabIndex={region ? 0 : -1}
      role="button"
      aria-pressed={selected}
      aria-label={describeState(code, region)}
      onClick={() => region && onSelect(code)}
      onKeyDown={handleKeyDown}
      className="cursor-pointer transition-opacity duration-100 hover:opacity-85 focus-visible:outline-[2.5px] focus-visible:outline-[#7c46e1]"
    >
      {fullscreen ? <title>{describeState(code, region)}</title> : null}
    </path>
  );
};

/**
 * Mapa do IDH por estado (`.map-box` do protótipo): os nove estados na cor da
 * faixa, com a sigla. Clicar num estado escolhe ou desfaz o filtro.
 *
 * @example <IdhStateMap mapa={panel.mapa} selectedUf="PE" onSelect={toggleUf} />
 */
export const IdhStateMap = ({
  mapa,
  selectedUf,
  onSelect,
  svgRef,
  viewBox,
  fullscreen = false,
  className = "mx-auto block max-h-[520px] w-full",
}: {
  mapa: ChoroplethRegion[];
  selectedUf?: string;
  onSelect: (code: string) => void;
  svgRef?: Ref<SVGSVGElement>;
  viewBox?: string;
  fullscreen?: boolean;
  className?: string;
}) => {
  const byCode = new Map(mapa.map((region) => [region.code, region]));

  return (
    <svg
      ref={svgRef}
      viewBox={viewBox ?? `0 0 ${IDH_MAP_BOX.width} ${IDH_MAP_BOX.height}`}
      preserveAspectRatio="xMidYMid meet"
      role="group"
      aria-label="Mapa do IDH por estado do Nordeste"
      fontFamily={IDH_CHART_FONT}
      className={className}
    >
      {drawOrder(selectedUf).map((code) => (
        <StatePath
          key={code}
          code={code}
          region={byCode.get(code)}
          selected={code === selectedUf}
          fullscreen={fullscreen}
          onSelect={onSelect}
        />
      ))}
      {Object.entries(IDH_STATE_LABELS).map(([code, [x, y]]) => (
        <text
          key={code}
          x={x}
          y={y + 5}
          textAnchor="middle"
          fontSize="14"
          fontWeight="600"
          fill={IDH_COLORS.inkStrong}
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
};

/**
 * Legenda do mapa (`.mleg`): as cinco faixas com o intervalo e a contagem.
 *
 * @example <IdhMapLegend mapa={panel.mapa} />
 */
export const IdhMapLegend = ({
  mapa,
  className = "mt-3",
}: {
  mapa: ChoroplethRegion[];
  className?: string;
}) => (
  <div
    className={`flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-grey-1100 ${className}`}
  >
    {buildIdhLegend(mapa).map((item) => (
      <span key={item.label} className="inline-flex items-center gap-1.5">
        <i
          className="inline-block size-[9px] rounded-full"
          style={{ background: item.color }}
        />
        {item.label} ({item.range}){item.count ? ` · ${item.count}` : ""}
      </span>
    ))}
  </div>
);
