"use client";

import { useState } from "react";
import { RankedBars } from "@/components/Panel/RankedBars";
import { AtividadeHighlightChip } from "@/components/PibDashboard/AtividadeHighlightChip";
import type { ChartPoint } from "@/features/panels/chartOptions";
import { formatPercent } from "@/features/panels/format";

// Abaixo do lg, a caixa com rolagem interna prendia o dedo: a lista mostra só
// as primeiras e cresce no botão. O nth-child segue MOBILE_LIMIT (5 → n+6).
const MOBILE_LIMIT = 5;
const HIDE_EXTRA_ROWS = "max-lg:[&_li:nth-child(n+6)]:hidden";

export const formatParticipacao = (value: number) => formatPercent(value, 2);

export type AtividadeSelection = {
  atividade: string | null;
  onSelectAtividade: (atividade: string | null) => void;
  onPreviewAtividade?: (atividade: string | null) => void;
};

// "Toque" em tela de toque, "Clique" com mouse (pelo ponteiro, não pela largura).
const ListHint = () => (
  <p className="text-sm text-grey-800">
    <span className="pointer-coarse:hidden">Clique</span>
    <span className="hidden pointer-coarse:inline">Toque</span> numa atividade
    para destacá-la no mapa
  </p>
);

const ExpandButton = ({
  expanded,
  total,
  onToggle,
}: {
  expanded: boolean;
  total: number;
  onToggle: () => void;
}) => (
  <button
    type="button"
    aria-expanded={expanded}
    onClick={onToggle}
    className="min-h-11 self-start rounded-md px-2 text-sm font-medium text-green-900 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-green-800 lg:hidden"
  >
    {expanded ? "Ver menos" : `Ver todas (${total})`}
  </button>
);

const ScrollingBars = ({
  points,
  collapsed,
  atividade,
  onSelectAtividade,
  onPreviewAtividade,
}: AtividadeSelection & { points: ChartPoint[]; collapsed: boolean }) => (
  <div className="relative xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
    <div
      className={`lg:h-72 lg:overflow-y-auto lg:pb-6 xl:h-auto xl:min-h-0 xl:flex-1 ${collapsed ? HIDE_EXTRA_ROWS : ""}`}
    >
      <RankedBars
        points={points}
        formatValue={formatParticipacao}
        selectedLabel={atividade}
        onSelect={onSelectAtividade}
        onPreview={onPreviewAtividade}
      />
    </div>

    {/* Degradê no rodapé: mostra que a lista continua rolando. */}
    {points.length > 4 ? (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-10 bg-gradient-to-t from-white lg:block"
      />
    ) : null}
  </div>
);

export const AtividadeList = ({
  points,
  ...selection
}: AtividadeSelection & { points: ChartPoint[] }) => {
  const [expanded, setExpanded] = useState(false);
  const collapsible = points.length > MOBILE_LIMIT;

  return (
    <div className="flex flex-col gap-2 xl:min-h-0 xl:flex-1">
      <ListHint />
      <ScrollingBars
        points={points}
        collapsed={collapsible && !expanded}
        {...selection}
      />
      {collapsible ? (
        <ExpandButton
          expanded={expanded}
          total={points.length}
          onToggle={() => setExpanded((value) => !value)}
        />
      ) : null}
      {selection.atividade ? (
        <div className="lg:hidden">
          <AtividadeHighlightChip
            atividade={selection.atividade}
            onClear={() => selection.onSelectAtividade(null)}
            withMapLink
          />
        </div>
      ) : null}
    </div>
  );
};
