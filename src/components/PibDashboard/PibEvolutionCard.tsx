"use client";

import type { PibCardProps } from "@/components/PibDashboard/pibCardProps";
import {
  PibLineChart,
  PibLineChartSkeleton,
} from "@/components/PibDashboard/PibLineChart";
import {
  PIB_CARD_INFO,
  PIB_LINE_TITLES,
} from "@/components/PibDashboard/pibTexts";
import { ProtoCard } from "@/components/ProtoPanel/ProtoCard";
import { ProtoCardInfo } from "@/components/ProtoPanel/ProtoCardInfo";
import {
  ProtoCardMenu,
  useSvgChart,
} from "@/components/ProtoPanel/ProtoCardMenu";
import {
  type PibLineKey,
  pibLineSubtitle,
} from "@/features/panels/pib/pibLineChart";

const INFO: Record<PibLineKey, string> = {
  pib: PIB_CARD_INFO.linePib,
  perCapita: PIB_CARD_INFO.linePerCapita,
};

/**
 * Card de linha de uma série do PIB (`seriesKey`): "Dinâmica temporal do PIB
 * total" ou "do PIB per capita", cada um com o seu eixo. `ano`: o ano
 * pedido, destacado na hora.
 *
 * @example <PibEvolutionCard seriesKey="pib" data={panel} place="Nordeste" state="ok" ano={2021} onRetry={retry} onSelectYear={pickYear} />
 */
export const PibEvolutionCard = ({
  seriesKey,
  data,
  place,
  ano,
  onSelectYear,
  ...status
}: PibCardProps & {
  seriesKey: PibLineKey;
  ano: number;
  onSelectYear: (ano: number) => void;
}) => {
  const chart = useSvgChart();
  const title = PIB_LINE_TITLES[seriesKey];

  return (
    <ProtoCard
      {...status}
      title={title}
      subtitle={pibLineSubtitle(
        place,
        data.serie.map((point) => point.ano),
      )}
      kind="line"
      skeleton={<PibLineChartSkeleton />}
      actions={
        <>
          <ProtoCardInfo title={title} text={INFO[seriesKey]} />
          <ProtoCardMenu title={title} chart={chart} />
        </>
      }
    >
      <PibLineChart
        seriesKey={seriesKey}
        serie={data.serie}
        ano={ano}
        onSelectYear={onSelectYear}
        svgRef={chart.ref}
      />
    </ProtoCard>
  );
};
