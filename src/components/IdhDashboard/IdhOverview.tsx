"use client";

import { useState } from "react";
import { IdhBigNumbers } from "@/components/IdhDashboard/IdhBigNumbers";
import { IdhLineChart } from "@/components/IdhDashboard/IdhLineChart";
import { IdhMapLegend } from "@/components/IdhDashboard/IdhMapLegend";
import { buildIdhMapProps } from "@/components/IdhDashboard/idhMapProps";
import {
  IDH_CARD_FOOTER,
  IDH_CARD_INFO,
} from "@/components/IdhDashboard/idhCardTexts";
import { IdhRankingBars } from "@/components/IdhDashboard/IdhRanking";
import {
  ProtoCard,
  type ProtoCardState,
} from "@/components/ProtoPanel/ProtoCard";
import { ProtoCardInfo } from "@/components/ProtoPanel/ProtoCardInfo";
import {
  ProtoCardMenu,
  useSvgChart,
} from "@/components/ProtoPanel/ProtoCardMenu";
import { ProtoIcon } from "@/components/ProtoPanel/ProtoIcon";
import { ProtoMapFullscreen } from "@/components/ProtoPanel/ProtoMapFullscreen";
import { ProtoStateMap } from "@/components/ProtoPanel/ProtoStateMap";
import { ICON_BUTTON } from "@/components/ProtoPanel/protoStyles";
import { rankIdhStates } from "@/features/panels/idh/idhClasses";
import {
  describeIdhSerie,
  type IdhPanelData,
} from "@/features/panels/idh/idhPanel";

type CardStatus = { state: ProtoCardState; onRetry: () => void };

type OverviewProps = CardStatus & {
  data: IdhPanelData;
  onSelectUf: (uf: string) => void;
  onSelectYear: (ano: number) => void;
};

const EVOLUTION_TITLE =
  "Evolução anual do IDH e do IDH ajustado à desigualdade";
const MAP_TITLE = "Mapa do IDH por estado";
const RANKING_TITLE = "Ranking do IDH por estado";

const EvolutionCard = ({
  data,
  onSelectYear,
  ...status
}: Omit<OverviewProps, "onSelectUf">) => {
  const chart = useSvgChart();

  return (
    <ProtoCard
      {...status}
      footer={IDH_CARD_FOOTER}
      title={EVOLUTION_TITLE}
      mobileTitle="Evolução anual do IDH"
      subtitle={describeIdhSerie(data)}
      kind="line"
      actions={
        <>
          <ProtoCardInfo
            title={EVOLUTION_TITLE}
            text={IDH_CARD_INFO.evolution}
          />
          <ProtoCardMenu title={EVOLUTION_TITLE} chart={chart} />
        </>
      }
    >
      <IdhLineChart
        serie={data.serie}
        ano={data.filters.ano}
        onSelectYear={onSelectYear}
        svgRef={chart.ref}
      />
    </ProtoCard>
  );
};

const MapCard = ({
  data,
  onSelectUf,
  ...status
}: Omit<OverviewProps, "onSelectYear">) => {
  const chart = useSvgChart();
  const [fullscreen, setFullscreen] = useState(false);
  const subtitle = `Faixas de desenvolvimento humano · ${data.filters.ano}`;
  const mapProps = buildIdhMapProps(data.mapa, data.filters.uf, onSelectUf);

  return (
    <ProtoCard
      {...status}
      footer={IDH_CARD_FOOTER}
      title={MAP_TITLE}
      subtitle={subtitle}
      kind="map"
      bodyClassName="flex flex-col"
      actions={
        <>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-label="Abrir mapa em tela cheia"
            title="Tela cheia"
            disabled={status.state !== "ok"}
            onClick={() => setFullscreen(true)}
            className={ICON_BUTTON}
          >
            <ProtoIcon name="fullscreen" size={18} stroke={1.7} />
          </button>
          <ProtoCardInfo title={MAP_TITLE} text={IDH_CARD_INFO.map} />
          <ProtoCardMenu title={MAP_TITLE} chart={chart} />
        </>
      }
    >
      <div className="relative rounded-[8px] bg-[#d6f1fa] p-1">
        <ProtoStateMap {...mapProps} svgRef={chart.ref} />
      </div>
      <IdhMapLegend mapa={data.mapa} />
      <ProtoMapFullscreen
        {...mapProps}
        open={fullscreen}
        onOpenChange={setFullscreen}
        title="Mapa do IDH por estado"
        subtitle={subtitle}
        legend={<IdhMapLegend mapa={data.mapa} className="" />}
      />
    </ProtoCard>
  );
};

const RankingCard = ({
  data,
  onSelectUf,
  ...status
}: Omit<OverviewProps, "onSelectYear">) => (
  <ProtoCard
    {...status}
    footer={IDH_CARD_FOOTER}
    title={RANKING_TITLE}
    mobileTitle="Comparação entre os estados"
    subtitle={`Do maior para o menor · barras de 0 a 1 · ${data.filters.ano}`}
    mobileSubtitle={`IDH por estado · ${data.filters.ano}`}
    kind="rank"
    bodyClassName="flex flex-col"
    actions={
      <>
        <ProtoCardInfo title={RANKING_TITLE} text={IDH_CARD_INFO.ranking} />
        <ProtoCardMenu title={RANKING_TITLE} />
      </>
    }
  >
    <IdhRankingBars
      states={rankIdhStates(data.mapa)}
      selectedUf={data.filters.uf}
      onSelect={onSelectUf}
    />
  </ProtoCard>
);

/**
 * Visão geral do painel (`#v-geral` do protótipo): indicadores, a série anual
 * e, lado a lado, o mapa e o ranking dos estados.
 *
 * @example <IdhOverview data={panel} state="ok" onRetry={retry} onSelectUf={toggleUf} onSelectYear={pickYear} />
 */
export const IdhOverview = ({
  onSelectYear,
  onSelectUf,
  ...props
}: OverviewProps) => (
  <div className="flex flex-col gap-4">
    <IdhBigNumbers
      data={props.data}
      state={props.state}
      onRetry={props.onRetry}
    />
    <EvolutionCard {...props} onSelectYear={onSelectYear} />
    <div className="grid grid-cols-2 items-stretch gap-6 max-[1000px]:grid-cols-1 max-[1000px]:gap-4">
      <MapCard {...props} onSelectUf={onSelectUf} />
      <RankingCard {...props} onSelectUf={onSelectUf} />
    </div>
  </div>
);
