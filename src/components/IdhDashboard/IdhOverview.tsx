"use client";

import { useState } from "react";
import { IdhBigNumbers } from "@/components/IdhDashboard/IdhBigNumbers";
import { IdhCard, type IdhCardState } from "@/components/IdhDashboard/IdhCard";
import {
  IDH_CARD_INFO,
  IdhCardInfo,
} from "@/components/IdhDashboard/IdhCardInfo";
import {
  IdhCardMenu,
  useSvgChart,
} from "@/components/IdhDashboard/IdhCardMenu";
import { IdhIcon } from "@/components/IdhDashboard/IdhIcon";
import { IdhLineChart } from "@/components/IdhDashboard/IdhLineChart";
import { IdhMapFullscreen } from "@/components/IdhDashboard/IdhMapFullscreen";
import { IdhRankingBars } from "@/components/IdhDashboard/IdhRanking";
import {
  IdhMapLegend,
  IdhStateMap,
} from "@/components/IdhDashboard/IdhStateMap";
import { ICON_BUTTON } from "@/components/IdhDashboard/idhStyles";
import { rankIdhStates } from "@/features/panels/idh/idhClasses";
import {
  describeIdhSerie,
  type IdhPanelData,
} from "@/features/panels/idh/idhPanel";

type CardStatus = { state: IdhCardState; onRetry: () => void };

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
    <IdhCard
      {...status}
      title={EVOLUTION_TITLE}
      mobileTitle="Evolução anual do IDH"
      subtitle={describeIdhSerie(data)}
      kind="line"
      actions={
        <>
          <IdhCardInfo title={EVOLUTION_TITLE} text={IDH_CARD_INFO.evolution} />
          <IdhCardMenu title={EVOLUTION_TITLE} chart={chart} />
        </>
      }
    >
      <IdhLineChart
        serie={data.serie}
        ano={data.filters.ano}
        onSelectYear={onSelectYear}
        svgRef={chart.ref}
      />
    </IdhCard>
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

  return (
    <IdhCard
      {...status}
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
            <IdhIcon name="fullscreen" size={18} stroke={1.7} />
          </button>
          <IdhCardInfo title={MAP_TITLE} text={IDH_CARD_INFO.map} />
          <IdhCardMenu title={MAP_TITLE} chart={chart} />
        </>
      }
    >
      <div className="relative rounded-[8px] bg-[#d6f1fa] p-1">
        <IdhStateMap
          mapa={data.mapa}
          selectedUf={data.filters.uf}
          onSelect={onSelectUf}
          svgRef={chart.ref}
        />
      </div>
      <IdhMapLegend mapa={data.mapa} />
      <IdhMapFullscreen
        open={fullscreen}
        onOpenChange={setFullscreen}
        subtitle={subtitle}
        mapa={data.mapa}
        selectedUf={data.filters.uf}
        onSelect={onSelectUf}
      />
    </IdhCard>
  );
};

const RankingCard = ({
  data,
  onSelectUf,
  ...status
}: Omit<OverviewProps, "onSelectYear">) => (
  <IdhCard
    {...status}
    title={RANKING_TITLE}
    mobileTitle="Comparação entre os estados"
    subtitle={`Do maior para o menor · barras de 0 a 1 · ${data.filters.ano}`}
    mobileSubtitle={`IDH por estado · ${data.filters.ano}`}
    kind="rank"
    bodyClassName="flex flex-col"
    actions={
      <>
        <IdhCardInfo title={RANKING_TITLE} text={IDH_CARD_INFO.ranking} />
        <IdhCardMenu title={RANKING_TITLE} />
      </>
    }
  >
    <IdhRankingBars
      states={rankIdhStates(data.mapa)}
      selectedUf={data.filters.uf}
      onSelect={onSelectUf}
    />
  </IdhCard>
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
