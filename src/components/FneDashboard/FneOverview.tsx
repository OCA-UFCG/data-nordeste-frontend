"use client";

import { Building2, CircleDollarSign, FileText, Receipt } from "lucide-react";
import type { ReactNode } from "react";
import {
  FneBarCard,
  FneColumnCard,
  FnePorteCard,
  FneRideCard,
} from "@/components/FneDashboard/FneCharts";
import { FneHighlights } from "@/components/FneDashboard/FneHighlights";
import { FneMap, useFneMapHighlight } from "@/components/FneDashboard/FneMap";
import { HighlightCard } from "@/components/Panel/cards/HighlightCards";
import type { KpiItem } from "@/components/Panel/cards/KpiCards";
import { PanelCarousel } from "@/components/Panel/layout/PanelCarousel";
import type { FneTotals } from "@/features/panels/fne/fneBreakdowns";
import type { FneFilters, FneVisao } from "@/features/panels/fne/fneFilters";
import { formatQuantidade, formatValor } from "@/features/panels/fne/fneLabels";
import { fneStateCodes } from "@/features/panels/fne/fneMap";
import type { FnePanelData } from "@/features/panels/fne/fnePanel";
import { toggleValue } from "@/features/panels/filterOptions";

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

const Cell = ({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <div className={`flex min-w-0 [&>*]:flex-1 ${className}`}>{children}</div>
);

const FneStateCard = ({
  data,
  visao,
  onChange,
  onPreview,
}: {
  data: FnePanelData;
  visao: FneVisao;
  onChange: (next: FneFilters) => void;
  onPreview: (codes: string[] | null) => void;
}) => {
  const { filters, ufs } = data;
  const sigla = (nome: string | null) =>
    ufs.find((uf) => uf.nome === nome)?.sigla;
  const selected = ufs.find((uf) => uf.sigla === filters.uf)?.nome ?? null;

  return (
    <FneBarCard
      chart="estados"
      data={data}
      visao={visao}
      selectedLabel={selected}
      onSelect={(nome) => onChange({ ...filters, uf: sigla(nome), muns: [] })}
      onPreview={(nome) => {
        const uf = sigla(nome);

        onPreview(uf ? fneStateCodes(data.mapa, uf) : null);
      }}
    />
  );
};

// Cada grade tem uma célula que dita a altura da linha e outra que se ajusta
// a ela (mapa, colunas e Top 20 esticam; as barras repartem a sobra), para
// nenhum card terminar antes do vizinho.
export const FneOverview = ({
  data,
  visao,
  onChange,
}: {
  data: FnePanelData;
  visao: FneVisao;
  onChange: (next: FneFilters) => void;
}) => {
  const { filters } = data;
  const chartProps = { data, visao };
  const highlight = useFneMapHighlight(data.mapa, visao);
  const toggleMunicipality = (cdMun: string) =>
    onChange({ ...filters, muns: toggleValue(filters.muns, cdMun) });

  return (
    <div className="flex flex-col gap-6">
      <PanelCarousel label="Totais do recorte" columns="lg:grid-cols-4">
        {orderedCards(data.totais, visao).map((item) => (
          <HighlightCard key={item.label} tone="green" {...item} />
        ))}
      </PanelCarousel>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:grid-rows-[minmax(20rem,auto)_minmax(20rem,auto)]">
        <Cell className="lg:row-span-2 lg:h-0 lg:min-h-full">
          <FneMap
            data={data}
            visao={visao}
            highlight={highlight}
            onSelectAno={(ano) => onChange({ ...filters, ano })}
            onSelectMunicipality={toggleMunicipality}
          />
        </Cell>
        <Cell>
          <FneColumnCard chart="setores" {...chartProps} />
        </Cell>
        <Cell>
          <FnePorteCard {...chartProps} />
        </Cell>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Cell className="lg:row-span-2">
          <FneStateCard
            data={data}
            visao={visao}
            onChange={onChange}
            onPreview={highlight.setPreviewCodes}
          />
        </Cell>
        <Cell>
          <FneColumnCard chart="portesPopulacionais" {...chartProps} />
        </Cell>
        <Cell>
          <FneColumnCard chart="semiarido" {...chartProps} />
        </Cell>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:grid-rows-[minmax(16rem,auto)_minmax(16rem,auto)]">
        <Cell className="lg:row-span-2 lg:h-0 lg:min-h-full">
          <FneHighlights
            items={data.destaques[visao]}
            visao={visao}
            ano={filters.ano}
            selectedCodes={filters.muns}
            onSelect={toggleMunicipality}
            onPreview={(cdMun) =>
              highlight.setPreviewCodes(cdMun ? [cdMun] : null)
            }
          />
        </Cell>
        <Cell>
          <FneBarCard chart="tipologias" {...chartProps} />
        </Cell>
        <Cell>
          <FneRideCard {...chartProps} />
        </Cell>
      </div>
    </div>
  );
};
