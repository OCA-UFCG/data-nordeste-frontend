"use client";

import { IdhBigNumbers } from "@/components/IdhDashboard/IdhBigNumbers";
import { IdhLineChart } from "@/components/IdhDashboard/IdhLineChart";
import { IdhMapCard } from "@/components/IdhDashboard/IdhMapCard";
import {
  idhEvolutionInfo,
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
  updatedAt?: string;
};

type OverviewProps = Omit<CardProps, "state"> & {
  states: IdhCardStates;
  onSelectUf: (uf: string) => void;
  onSelectYear: (ano: number) => void;
  onFiltersChange: (filters: IdhFilters) => void;
};

const EVOLUTION_TITLE =
  "Evolução anual do IDH e do IDH ajustado à desigualdade";
const RANKING_TITLE = "Ranking do IDH por estado";

const EvolutionCard = ({
  data,
  selection,
  updatedAt,
  onSelectYear,
  ...status
}: CardProps & { onSelectYear: (ano: number) => void }) => {
  const chart = useSvgChart();

  return (
    <ProtoCard
      {...status}
      updatedAt={updatedAt}
      title={EVOLUTION_TITLE}
      mobileTitle="Evolução anual do IDH"
      subtitle={describeIdhSerie(data)}
      kind="line"
      actions={
        <>
          <ProtoCardInfo
            title={EVOLUTION_TITLE}
            text={idhEvolutionInfo(data.yearRange)}
          />
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
  updatedAt,
  onSelectUf,
  ...status
}: CardProps & { onSelectUf: (uf: string) => void }) => (
  <ProtoCard
    {...status}
    updatedAt={updatedAt}
    title={RANKING_TITLE}
    mobileTitle="Comparação entre os estados"
    subtitle={withYear(
      "Do maior para o menor · barras de 0 a 1",
      data.filters.ano,
    )}
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
  <div className="flex flex-col gap-4">
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
    <div className="grid grid-cols-2 items-stretch gap-6 max-[1000px]:grid-cols-1 max-[1000px]:gap-4">
      <IdhMapCard
        {...props}
        state={states.map}
        onFiltersChange={onFiltersChange}
      />
      <RankingCard {...props} state={states.ranking} onSelectUf={onSelectUf} />
    </div>
  </div>
);
