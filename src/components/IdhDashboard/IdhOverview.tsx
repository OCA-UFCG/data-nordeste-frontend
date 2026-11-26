"use client";

import { IdhBigNumbers } from "@/components/IdhDashboard/IdhBigNumbers";
import { IdhLineChart } from "@/components/IdhDashboard/IdhLineChart";
import { IdhMapCard } from "@/components/IdhDashboard/IdhMapCard";
import { IDH_CARD_INFO } from "@/components/IdhDashboard/idhCardTexts";
import { IDH_SERIE_INFO } from "@/components/IdhDashboard/idhIndicatorInfo";
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
import { PROTO_GAP } from "@/components/ProtoPanel/protoStyles";
import type { IdhCardStates } from "@/features/panels/idh/idhCardState";
import { rankIdhStates } from "@/features/panels/idh/idhClasses";
import {
  describeIdhSerie,
  type IdhFilters,
  type IdhPanelData,
} from "@/features/panels/idh/idhPanel";
import { withYear } from "@/features/panels/territorialFilters";

type CardStatus = { state: ProtoCardState; onRetry: () => void };

// `selection`: os filtros pedidos. O ano da série e o estado destacado no mapa
// e no ranking seguem o clique na hora, antes de o servidor responder.
type CardProps = CardStatus & {
  data: IdhPanelData;
  selection: IdhFilters;
};

type OverviewProps = Omit<CardProps, "state"> & {
  states: IdhCardStates;
  onSelectUf: (uf: string) => void;
  onSelectYear: (ano: number) => void;
  onFiltersChange: (filters: IdhFilters) => void;
};

const EVOLUTION_TITLE =
  "Dinâmica anual do IDH e do IDH ajustado à desigualdade";
const RANKING_TITLE = "Ranking do IDH por estado";

const EvolutionCard = ({
  data,
  selection,
  onSelectYear,
  ...status
}: CardProps & { onSelectYear: (ano: number) => void }) => {
  const chart = useSvgChart();

  return (
    <ProtoCard
      {...status}
      title={EVOLUTION_TITLE}
      mobileTitle="Dinâmica anual do IDH"
      subtitle={describeIdhSerie(data)}
      kind="line"
      actions={
        <>
          <ProtoCardInfo title={EVOLUTION_TITLE} text={IDH_SERIE_INFO} />
          <ProtoCardMenu title={EVOLUTION_TITLE} chart={chart} />
        </>
      }
    >
      <IdhLineChart
        serie={data.serie}
        ano={selection.ano}
        onSelectYear={onSelectYear}
        svgRef={chart.ref}
      />
    </ProtoCard>
  );
};

const RankingCard = ({
  data,
  selection,
  onSelectUf,
  ...status
}: CardProps & { onSelectUf: (uf: string) => void }) => (
  <ProtoCard
    {...status}
    title={RANKING_TITLE}
    mobileTitle="Comparação entre os estados"
    subtitle={withYear("Índice varia de 0 a 1", data.filters.ano)}
    mobileSubtitle={withYear("IDH por estado", data.filters.ano)}
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
      selectedUf={selection.uf}
      onSelect={onSelectUf}
    />
  </ProtoCard>
);

/**
 * Visão geral do painel (`#v-geral` do protótipo): indicadores, a série anual
 * e, lado a lado, o mapa e o ranking dos estados. Cada card tem o próprio
 * estado: trocar a UF não põe o mapa nem o ranking em esqueleto. O mapa
 * filtra por `onFiltersChange` (o pedido da barra de filtros); o ranking, por
 * `onSelectUf`.
 *
 * @example <IdhOverview data={panel} selection={panel.filters} states={states} onRetry={retry} onSelectUf={toggleUf} onSelectYear={pickYear} onFiltersChange={changeFilters} />
 */
export const IdhOverview = ({
  states,
  onSelectYear,
  onSelectUf,
  onFiltersChange,
  ...props
}: OverviewProps) => (
  <div className={`flex flex-col ${PROTO_GAP}`}>
    <IdhBigNumbers
      data={props.data}
      state={states.bigNumbers}
      onRetry={props.onRetry}
    />
    <EvolutionCard
      {...props}
      state={states.evolution}
      onSelectYear={onSelectYear}
    />
    <div
      className={`grid grid-cols-2 items-stretch max-[1000px]:grid-cols-1 ${PROTO_GAP}`}
    >
      <IdhMapCard
        {...props}
        state={states.map}
        onFiltersChange={onFiltersChange}
      />
      <RankingCard {...props} state={states.ranking} onSelectUf={onSelectUf} />
    </div>
  </div>
);
