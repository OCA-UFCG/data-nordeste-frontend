"use client";

import type { PibCardProps } from "@/components/PibDashboard/pibCardProps";
import {
  PibLineChart,
  PibLineChartSkeleton,
} from "@/components/PibDashboard/PibLineChart";
import { PibInfoParagraphs } from "@/components/PibDashboard/PibInfoParagraphs";
import {
  PIB_LINE_INFO,
  PIB_LINE_TITLE,
} from "@/components/PibDashboard/pibTexts";
import { ProtoCard } from "@/components/ProtoPanel/ProtoCard";
import { ProtoCardInfo } from "@/components/ProtoPanel/ProtoCardInfo";
import {
  ProtoCardMenu,
  useSvgChart,
} from "@/components/ProtoPanel/ProtoCardMenu";
import { pibLineSubtitle } from "@/features/panels/pib/pibLineChart";

/**
 * Card "Dinâmica temporal do PIB e do PIB per capita": a série do território em linha, com o PIB
 * e o per capita. `ano`: o ano pedido, destacado na hora.
 *
 * @example <PibEvolutionCard data={panel} place="Nordeste" state="ok" ano={2021} onRetry={retry} onSelectYear={pickYear} />
 */
export const PibEvolutionCard = ({
  data,
  place,
  ano,
  onSelectYear,
  ...status
}: PibCardProps & { ano: number; onSelectYear: (ano: number) => void }) => {
  const chart = useSvgChart();

  return (
    <ProtoCard
      {...status}
      title={PIB_LINE_TITLE}
      subtitle={pibLineSubtitle(
        place,
        data.serie.map((point) => point.ano),
      )}
      kind="line"
      skeleton={<PibLineChartSkeleton />}
      actions={
        <>
          <ProtoCardInfo
            title={PIB_LINE_TITLE}
            text={<PibInfoParagraphs paragraphs={PIB_LINE_INFO} />}
          />
          <ProtoCardMenu title={PIB_LINE_TITLE} chart={chart} />
        </>
      }
    >
      <PibLineChart
        serie={data.serie}
        ano={ano}
        onSelectYear={onSelectYear}
        svgRef={chart.ref}
      />
    </ProtoCard>
  );
};
