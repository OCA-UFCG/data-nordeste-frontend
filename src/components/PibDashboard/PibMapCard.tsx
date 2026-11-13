"use client";

import { useState } from "react";
import type { PibCardProps } from "@/components/PibDashboard/pibCardProps";
import {
  PIB_CARD_FOOTER,
  PIB_CARD_INFO,
} from "@/components/PibDashboard/pibTexts";
import { PIB_COLORS } from "@/components/PibDashboard/pibTheme";
import { ProtoCard } from "@/components/ProtoPanel/ProtoCard";
import { ProtoCardInfo } from "@/components/ProtoPanel/ProtoCardInfo";
import {
  ProtoCardMenu,
  useSvgChart,
} from "@/components/ProtoPanel/ProtoCardMenu";
import { ProtoIcon } from "@/components/ProtoPanel/ProtoIcon";
import { ProtoMapFullscreen } from "@/components/ProtoPanel/ProtoMapFullscreen";
import {
  ProtoStateMap,
  type ProtoStateMapProps,
} from "@/components/ProtoPanel/ProtoStateMap";
import { ICON_BUTTON } from "@/components/ProtoPanel/protoStyles";
import { formatPibReais } from "@/features/panels/pib/pibFormat";
import type { PibPanelData } from "@/features/panels/pib/pibPanel";
import {
  describeStatesOffMap,
  PIB_STATE_BINS,
  pibStateBin,
} from "@/features/panels/pib/pibStates";
import { areaLabel } from "@/features/panels/territorialOptions";

const TITLE = "Mapa do PIB por estado";

/**
 * Ligação do mapa do PIB: a cor é a faixa do PIB total do estado e só estado
 * da área de interesse escolhe. Usado pelo mapa do card e pelo de tela cheia.
 *
 * @example <ProtoStateMap {...buildPibMapProps(panel, toggleUf)} />
 */
export const buildPibMapProps = (
  data: PibPanelData,
  onSelect: (code: string) => void,
): ProtoStateMapProps => {
  const byCode = new Map(data.estados.map((estado) => [estado.code, estado]));

  return {
    fillFor: (code) => {
      const estado = byCode.get(code);

      return estado ? pibStateBin(estado.value).color : PIB_COLORS.offArea;
    },
    describe: (code) => {
      const estado = byCode.get(code);

      return estado
        ? `${estado.name}, ${formatPibReais(estado.value)}`
        : `${code}, fora da área`;
    },
    isSelectable: (code) => byCode.has(code),
    label: `${TITLE}, ${areaLabel(data.filters.area)}`,
    selectedUfs: data.filters.uf ?? [],
    onSelect,
  };
};

// `.mleg`: as cinco faixas do PIB total.
const MapLegend = ({ className = "mt-3" }: { className?: string }) => (
  <div
    className={`flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-grey-1100 ${className}`}
  >
    {PIB_STATE_BINS.map((bin) => (
      <span key={bin.label} className="inline-flex items-center gap-1.5">
        <i
          className="inline-block size-[9px] rounded-full"
          style={{ background: bin.color }}
        />
        {bin.label}
      </span>
    ))}
  </div>
);

const FullscreenButton = ({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    aria-haspopup="dialog"
    aria-label="Abrir mapa em tela cheia"
    title="Tela cheia"
    disabled={disabled}
    onClick={onClick}
    className={ICON_BUTTON}
  >
    <ProtoIcon name="fullscreen" size={18} stroke={1.7} />
  </button>
);

/**
 * Card "Mapa do PIB por estado": cada estado na cor da faixa do seu PIB
 * total na área de interesse. Clicar num estado o põe ou tira do filtro.
 *
 * @example <PibMapCard data={panel} place="Nordeste" state="ok" onRetry={retry} onSelectUf={toggleUf} />
 */
export const PibMapCard = ({
  data,
  onSelectUf,
  ...status
}: Omit<PibCardProps, "place"> & { onSelectUf: (uf: string) => void }) => {
  const chart = useSvgChart();
  const [fullscreen, setFullscreen] = useState(false);
  const subtitle = `PIB total por estado · ${areaLabel(data.filters.area)} · ${data.filters.ano}`;
  const mapProps = buildPibMapProps(data, onSelectUf);
  const offMap = describeStatesOffMap(data.estados);

  return (
    <ProtoCard
      {...status}
      footer={PIB_CARD_FOOTER}
      title={TITLE}
      subtitle={subtitle}
      kind="map"
      bodyClassName="flex flex-col"
      actions={
        <>
          <FullscreenButton
            disabled={status.state !== "ok"}
            onClick={() => setFullscreen(true)}
          />
          <ProtoCardInfo title={TITLE} text={PIB_CARD_INFO.map} />
          <ProtoCardMenu title={TITLE} chart={chart} />
        </>
      }
    >
      {/* flex-1: o mapa acompanha a altura da coluna dos setores, ao lado. */}
      <div
        className="relative flex flex-1 items-center rounded-[8px] p-1"
        style={{ background: PIB_COLORS.sea }}
      >
        <ProtoStateMap {...mapProps} svgRef={chart.ref} />
      </div>
      <MapLegend />
      {offMap ? <p className="mt-2 text-xs text-grey-800">{offMap}</p> : null}
      <ProtoMapFullscreen
        {...mapProps}
        open={fullscreen}
        onOpenChange={setFullscreen}
        title={TITLE}
        subtitle={subtitle}
        legend={<MapLegend className="" />}
      />
    </ProtoCard>
  );
};
