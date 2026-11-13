"use client";

import type { PibCardProps } from "@/components/PibDashboard/pibCardProps";
import { PibLineChart } from "@/components/PibDashboard/PibLineChart";
import {
  PIB_CARD_FOOTER,
  PIB_CARD_INFO,
} from "@/components/PibDashboard/pibTexts";
import { ProtoCard } from "@/components/ProtoPanel/ProtoCard";
import { ProtoCardInfo } from "@/components/ProtoPanel/ProtoCardInfo";
import {
  ProtoCardMenu,
  useSvgChart,
} from "@/components/ProtoPanel/ProtoCardMenu";

const TITLE = "Evolução anual do PIB";

// "2010 a 2023", pelos anos que a série realmente tem.
const describeSpan = (years: number[]): string =>
  years.length ? `${years[0]} a ${years[years.length - 1]} · ` : "";

/**
 * Card "Evolução anual do PIB": a série do território em linha, com o PIB
 * total e o per capita.
 *
 * @example <PibEvolutionCard data={panel} place="Nordeste" state="ok" onRetry={retry} onSelectYear={pickYear} />
 */
export const PibEvolutionCard = ({
  data,
  place,
  onSelectYear,
  ...status
}: PibCardProps & { onSelectYear: (ano: number) => void }) => {
  const chart = useSvgChart();
  const span = describeSpan(data.serie.map((point) => point.ano));

  return (
    <ProtoCard
      {...status}
      footer={PIB_CARD_FOOTER}
      title={TITLE}
      subtitle={`${place} · ${span}PIB total e per capita`}
      kind="line"
      actions={
        <>
          <ProtoCardInfo title={TITLE} text={PIB_CARD_INFO.line} />
          <ProtoCardMenu title={TITLE} chart={chart} />
        </>
      }
    >
      <PibLineChart
        serie={data.serie}
        ano={data.filters.ano}
        onSelectYear={onSelectYear}
        svgRef={chart.ref}
      />
    </ProtoCard>
  );
};
