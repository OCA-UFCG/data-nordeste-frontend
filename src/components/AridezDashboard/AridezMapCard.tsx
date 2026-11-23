"use client";

import { useState } from "react";
import type { AridezCardProps } from "@/components/AridezDashboard/aridezCardProps";
import {
  ARIDEZ_CARD_FOOTER,
  ARIDEZ_CARD_INFO,
  ARIDEZ_CARD_SOURCE,
} from "@/components/AridezDashboard/aridezTexts";
import { ARIDEZ_COLORS } from "@/components/AridezDashboard/aridezTheme";
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
import type { AridezPanelData } from "@/features/panels/aridez/aridezPanel";
import {
  ARIDEZ_STATE_BINS,
  buildAridezStateLookup,
} from "@/features/panels/aridez/aridezStates";
import { describeStatesOffMap } from "@/features/panels/statesOffMap";
import { areaLabel } from "@/features/panels/territorialOptions";

const TITLE = "Área suscetível à desertificação por estado";
const MOBILE_TITLE = "Área suscetível por estado";

/**
 * Ligação do mapa da aridez: a cor é a faixa do % de ASD do estado e só
 * estado da área de interesse escolhe. Usado pelo card e pela tela cheia.
 *
 * @example <ProtoStateMap {...buildAridezMapProps(panel, ["PE"], selectUf)} />
 */
export const buildAridezMapProps = (
  data: AridezPanelData,
  selectedUfs: string[],
  onSelect: (code: string) => void,
): ProtoStateMapProps => {
  const lookup = buildAridezStateLookup(data.estados);

  return {
    fillFor: (code) => lookup.binFor(code)?.color ?? ARIDEZ_COLORS.offArea,
    describe: lookup.describe,
    isSelectable: lookup.isSelectable,
    label: `Mapa da área suscetível à desertificação por estado, ${areaLabel(data.filters.area)}`,
    selectedUfs,
    onSelect,
  };
};

/**
 * Card "Área suscetível à desertificação por estado": cada estado na cor da
 * faixa do % da sua área que é ASD. Clicar num estado deixa só ele no filtro.
 *
 * @example <AridezMapCard data={panel} selectedUfs={["PE"]} state="ok" onRetry={retry} onSelectUf={selectUf} />
 */
export const AridezMapCard = ({
  data,
  selectedUfs,
  onSelectUf,
  ...status
}: Omit<AridezCardProps, "place"> & {
  selectedUfs: string[];
  onSelectUf: (uf: string) => void;
}) => {
  const chart = useSvgChart();
  const [fullscreen, setFullscreen] = useState(false);
  const subtitle = `% da área do estado suscetível à desertificação · ${areaLabel(data.filters.area)} · ${data.filters.ano}`;
  const mapProps = buildAridezMapProps(data, selectedUfs, onSelectUf);
  const offMap = describeStatesOffMap(data.estados);

  return (
    <ProtoCard
      {...status}
      footer={ARIDEZ_CARD_FOOTER}
      title={TITLE}
      mobileTitle={MOBILE_TITLE}
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
          legend={<ProtoBinLegend bins={ARIDEZ_STATE_BINS} className="" />}
          source={ARIDEZ_CARD_SOURCE}
          hint={MAP_SELECT_HINT}
        />
      }
      actions={
        <>
          <ProtoFullscreenButton
            disabled={status.state === "loading" || status.state === "error"}
            onClick={() => setFullscreen(true)}
          />
          <ProtoCardInfo title={TITLE} text={ARIDEZ_CARD_INFO.map} />
          <ProtoCardMenu title={TITLE} chart={chart} />
        </>
      }
    >
      <div
        className="relative flex flex-1 items-center rounded-[8px] p-1"
        style={{ background: ARIDEZ_COLORS.sea }}
      >
        <ProtoStateMap {...mapProps} svgRef={chart.ref} />
      </div>
      <ProtoBinLegend bins={ARIDEZ_STATE_BINS} />
      {offMap ? <p className="mt-2 text-xs text-grey-800">{offMap}</p> : null}
    </ProtoCard>
  );
};
