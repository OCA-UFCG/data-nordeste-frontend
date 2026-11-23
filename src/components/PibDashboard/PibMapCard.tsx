"use client";

import { useState } from "react";
import type { PibCardProps } from "@/components/PibDashboard/pibCardProps";
import {
  PIB_CARD_FOOTER,
  PIB_CARD_INFO,
  PIB_CARD_SOURCE,
} from "@/components/PibDashboard/pibTexts";
import { PIB_COLORS } from "@/components/PibDashboard/pibTheme";
import { ProtoCard } from "@/components/ProtoPanel/ProtoCard";
import { ProtoCardInfo } from "@/components/ProtoPanel/ProtoCardInfo";
import {
  ProtoCardMenu,
  useSvgChart,
} from "@/components/ProtoPanel/ProtoCardMenu";
import {
  ProtoBinLegend,
  ProtoFullscreenButton,
} from "@/components/ProtoPanel/ProtoMapControls";
import {
  MAP_SELECT_HINT,
  ProtoMapFullscreen,
} from "@/components/ProtoPanel/ProtoMapFullscreen";
import {
  ProtoStateMap,
  type ProtoStateMapProps,
} from "@/components/ProtoPanel/ProtoStateMap";
import type { PibPanelData } from "@/features/panels/pib/pibPanel";
import {
  buildPibStateLookup,
  PIB_STATE_BINS,
} from "@/features/panels/pib/pibStates";
import { describeStatesOffMap } from "@/features/panels/statesOffMap";
import { areaLabel } from "@/features/panels/territorialOptions";

const TITLE = "Mapa do PIB por estado";

/**
 * Ligação do mapa do PIB: a cor é a faixa do PIB total do estado e só estado
 * da área de interesse escolhe. Usado pelo mapa do card e pelo de tela cheia.
 * `selectedUfs`: os estados do filtro pedido, contornados na hora.
 *
 * @example <ProtoStateMap {...buildPibMapProps(panel, ["PE"], selectUf)} />
 */
export const buildPibMapProps = (
  data: PibPanelData,
  selectedUfs: string[],
  onSelect: (code: string) => void,
): ProtoStateMapProps => {
  const lookup = buildPibStateLookup(data.estados);

  return {
    fillFor: (code) => lookup.binFor(code)?.color ?? PIB_COLORS.offArea,
    describe: lookup.describe,
    isSelectable: lookup.isSelectable,
    label: `${TITLE}, ${areaLabel(data.filters.area)}`,
    selectedUfs,
    onSelect,
  };
};

/**
 * Card "Mapa do PIB por estado": cada estado na cor da faixa do seu PIB
 * total na área de interesse. Clicar num estado deixa só ele no filtro.
 *
 * @example <PibMapCard data={panel} selectedUfs={["PE"]} state="ok" onRetry={retry} onSelectUf={selectUf} />
 */
export const PibMapCard = ({
  data,
  selectedUfs,
  onSelectUf,
  ...status
}: Omit<PibCardProps, "place"> & {
  selectedUfs: string[];
  onSelectUf: (uf: string) => void;
}) => {
  const chart = useSvgChart();
  const [fullscreen, setFullscreen] = useState(false);
  const subtitle = `PIB total por estado · ${areaLabel(data.filters.area)} · ${data.filters.ano}`;
  const mapProps = buildPibMapProps(data, selectedUfs, onSelectUf);
  const offMap = describeStatesOffMap(data.estados);

  return (
    <ProtoCard
      {...status}
      footer={PIB_CARD_FOOTER}
      title={TITLE}
      subtitle={subtitle}
      kind="map"
      bodyClassName="flex flex-col"
      overlay={
        <ProtoMapFullscreen
          {...mapProps}
          open={fullscreen}
          onOpenChange={setFullscreen}
          title={TITLE}
          subtitle={subtitle}
          legend={<ProtoBinLegend bins={PIB_STATE_BINS} className="" />}
          source={PIB_CARD_SOURCE}
          hint={MAP_SELECT_HINT}
        />
      }
      actions={
        <>
          <ProtoFullscreenButton
            disabled={status.state === "loading" || status.state === "error"}
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
      <ProtoBinLegend bins={PIB_STATE_BINS} />
      {offMap ? <p className="mt-2 text-xs text-grey-800">{offMap}</p> : null}
    </ProtoCard>
  );
};
