"use client";

import { Building2, CircleDollarSign, FileText, Receipt } from "lucide-react";
import { FneBarCard, FneRideCard } from "@/components/FneDashboard/FneCharts";
import { FneHighlights } from "@/components/FneDashboard/FneHighlights";
import { FneMap } from "@/components/FneDashboard/FneMap";
import { HighlightCard } from "@/components/Panel/HighlightCards";
import type { KpiItem } from "@/components/Panel/KpiCards";
import { PanelCarousel } from "@/components/Panel/PanelCarousel";
import type { FneTotals } from "@/features/panels/fne/fneBreakdowns";
import type { FneVisao } from "@/features/panels/fne/fneFilters";
import { formatQuantidade, formatValor } from "@/features/panels/fne/fneLabels";
import type { FnePanelData } from "@/features/panels/fne/fnePanel";

const totalCards = (totais: FneTotals): KpiItem[] => [
  {
    icon: FileText,
    label: "Quantidade de contratações",
    value: formatQuantidade(totais.quantidade),
  },
  {
    icon: CircleDollarSign,
    label: "Valor contratado",
    value: formatValor(totais.valor),
  },
  {
    icon: Receipt,
    label: "Ticket médio por contratação",
    value: formatValor(totais.ticketMedio),
  },
  {
    icon: Building2,
    label: "Municípios com contratações",
    value: formatQuantidade(totais.municipiosAtendidos),
  },
];

// O indicador da aba vem primeiro, como o número em destaque no ArcGIS.
const orderedCards = (totais: FneTotals, visao: FneVisao) => {
  const cards = totalCards(totais);

  return visao === "valor" ? [cards[1], cards[0], ...cards.slice(2)] : cards;
};

const TWO_COLUMNS = "grid grid-cols-1 gap-6 lg:grid-cols-2";

export const FneOverview = ({
  data,
  visao,
  onSelectAno,
  onSelectMunicipality,
}: {
  data: FnePanelData;
  visao: FneVisao;
  onSelectAno: (ano: number) => void;
  onSelectMunicipality: (cdMun: string) => void;
}) => {
  const chartProps = { data, visao };

  return (
    <div className="flex flex-col gap-6">
      <PanelCarousel label="Totais do recorte" columns="lg:grid-cols-4">
        {orderedCards(data.totais, visao).map((item) => (
          <HighlightCard key={item.label} tone="green" {...item} />
        ))}
      </PanelCarousel>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <div className="min-w-0">
          <FneMap
            data={data}
            visao={visao}
            onSelectAno={onSelectAno}
            onSelectMunicipality={onSelectMunicipality}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <FneBarCard chart="setores" {...chartProps} />
          <FneBarCard chart="portes" {...chartProps} />
        </div>
      </div>
      <div className={TWO_COLUMNS}>
        <FneBarCard chart="estados" {...chartProps} />
        <FneBarCard chart="tipologias" {...chartProps} />
        <FneBarCard chart="portesPopulacionais" {...chartProps} />
        <FneBarCard chart="semiarido" {...chartProps} />
      </div>
      <div className={TWO_COLUMNS}>
        <FneHighlights
          items={data.destaques[visao]}
          visao={visao}
          ano={data.filters.ano}
        />
        <FneRideCard {...chartProps} />
      </div>
    </div>
  );
};
