import { PibBigNumbers } from "@/components/PibDashboard/PibBigNumbers";
import type { PibCardProps } from "@/components/PibDashboard/pibCardProps";
import { PibEvolutionCard } from "@/components/PibDashboard/PibEvolutionCard";
import { PibMapCard } from "@/components/PibDashboard/PibMapCard";
import {
  PibAtividadeCard,
  PibVabCard,
} from "@/components/PibDashboard/PibSectorCards";
import { ProtoCardNotice } from "@/components/ProtoPanel/ProtoCard";
import { CARD_SHADOW } from "@/components/ProtoPanel/protoStyles";
import type { PibCardStates } from "@/features/panels/pib/pibCardState";
import { PIB_YEAR_RANGE } from "@/features/panels/pib/pibPanel";
import type { TerritorialFilters } from "@/features/panels/territorialFilters";
import { describeDefaultPlaceLabel } from "@/features/panels/territorialPlace";

export type PibLayoutProps = Omit<PibCardProps, "state"> & {
  states: PibCardStates;

  // Filtros pedidos (iguais a `data.filters` fora da navegação): o ano da
  // série e o recorte do mapa já mostram o pedido. `onFiltersChange` é o
  // mesmo caminho da barra de filtros (`request`).
  selection: TerritorialFilters;
  onFiltersChange: (filters: TerritorialFilters) => void;
  onSelectYear: (ano: number) => void;

  // Botões do aviso de ano sem dado setorial: mudar de ano (e mostrar a troca
  // no select de Ano) ou levar até o select.
  onShowSectorYear: (ano: number) => void;
  onPickYear: () => void;
  onReset: () => void;
};

// `.pgrid` do protótipo: o mapa e, ao lado, a coluna dos dois cards de setor,
// que dividem a altura. O mapa tem altura fixa (ver `PibMapCard`). Abaixo de
// 1000 px vira uma coluna só.
const BOTTOM_GRID =
  "grid grid-cols-2 items-stretch gap-6 max-[1000px]:grid-cols-1 max-[1000px]:gap-4";
const SECTOR_COLUMN =
  "flex min-w-0 flex-col gap-6 max-[1000px]:gap-4 [&>*]:flex-1";

/**
 * Grade do painel do PIB (`.pib-stack` do protótipo): números de destaque, a
 * série anual e, lado a lado, o mapa e os dois cards de setor.
 *
 * @example <PibGrids data={panel} selection={filters} place="Nordeste" states={states} onRetry={retry} onFiltersChange={request} onSelectYear={pickYear} onShowSectorYear={showYear} onPickYear={focusYear} />
 */
export const PibGrids = ({
  selection,
  states,
  onFiltersChange,
  onSelectYear,
  onShowSectorYear,
  onPickYear,
  ...card
}: Omit<PibLayoutProps, "onReset">) => (
  <div className="flex flex-col gap-4">
    <PibBigNumbers
      data={card.data}
      state={states.bigNumbers}
      onRetry={card.onRetry}
    />
    <PibEvolutionCard
      {...card}
      state={states.evolution}
      ano={selection.ano}
      onSelectYear={onSelectYear}
    />
    <div className={BOTTOM_GRID}>
      <PibMapCard
        selection={selection}
        onFiltersChange={onFiltersChange}
        state={states.map}
        onRetry={card.onRetry}
      />
      <div className={SECTOR_COLUMN}>
        <PibVabCard
          {...card}
          state={states.sectors}
          onSelectYear={onShowSectorYear}
          onPickYear={onPickYear}
        />
        <PibAtividadeCard
          {...card}
          state={states.sectors}
          onSelectYear={onShowSectorYear}
          onPickYear={onPickYear}
        />
      </div>
    </div>
  </div>
);

/**
 * Sem PIB para o território e o ano escolhidos: um aviso com o atalho para o
 * padrão do painel e o mapa sozinho (`.pgrid.solo` do protótipo).
 *
 * @example <PibEmptyLayout data={panel} selection={filters} place="Caatinga" states={states} onRetry={retry} onFiltersChange={request} onSelectYear={pickYear} onReset={reset} />
 */
export const PibEmptyLayout = ({
  selection,
  states,
  onFiltersChange,
  onReset,
  ...card
}: PibLayoutProps) => (
  <div className="flex flex-col gap-4">
    <article
      className={`flex min-w-0 flex-col rounded-[8px] border border-grey-300 bg-white px-5 py-4 ${CARD_SHADOW} max-[700px]:p-4`}
    >
      <ProtoCardNotice
        tone="warn"
        action={{
          label: describeDefaultPlaceLabel(PIB_YEAR_RANGE),
          onClick: onReset,
        }}
      >
        <b>ATENÇÃO:</b> não há dados para{" "}
        <b>{`${card.place} · ${card.data.filters.ano}`}</b>.
      </ProtoCardNotice>
    </article>
    <PibMapCard
      selection={selection}
      onFiltersChange={onFiltersChange}
      state={states.map}
      onRetry={card.onRetry}
    />
  </div>
);
