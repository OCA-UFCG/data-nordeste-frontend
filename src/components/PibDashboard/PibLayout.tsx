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
import { PIB_YEAR_RANGE } from "@/features/panels/pib/pibPanel";
import { describeDefaultPlaceLabel } from "@/features/panels/territorialPlace";

export type PibLayoutProps = PibCardProps & {
  onSelectUf: (uf: string) => void;
  onSelectYear: (ano: number) => void;
  onReset: () => void;
};

// `.pgrid` do protótipo: o mapa e, ao lado, a coluna dos dois cards de setor,
// que dividem a altura. Abaixo de 1000 px vira uma coluna só.
const BOTTOM_GRID =
  "grid grid-cols-2 items-stretch gap-6 max-[1000px]:grid-cols-1 max-[1000px]:gap-4";
const SECTOR_COLUMN =
  "flex min-w-0 flex-col gap-6 max-[1000px]:gap-4 [&>*]:flex-1";

/**
 * Grade do painel do PIB (`.pib-stack` do protótipo): números de destaque, a
 * série anual e, lado a lado, o mapa e os dois cards de setor.
 *
 * @example <PibGrids data={panel} place="Nordeste" state="ok" onRetry={retry} onSelectUf={toggleUf} onSelectYear={pickYear} />
 */
export const PibGrids = ({
  onSelectUf,
  onSelectYear,
  ...card
}: Omit<PibLayoutProps, "onReset">) => (
  <div className="flex flex-col gap-4">
    <PibBigNumbers data={card.data} state={card.state} onRetry={card.onRetry} />
    <PibEvolutionCard {...card} onSelectYear={onSelectYear} />
    <div className={BOTTOM_GRID}>
      <PibMapCard
        data={card.data}
        state={card.state}
        onRetry={card.onRetry}
        onSelectUf={onSelectUf}
      />
      <div className={SECTOR_COLUMN}>
        <PibVabCard {...card} onSelectYear={onSelectYear} />
        <PibAtividadeCard {...card} onSelectYear={onSelectYear} />
      </div>
    </div>
  </div>
);

/**
 * Sem PIB para o território e o ano escolhidos: um aviso com o atalho para o
 * padrão do painel e o mapa sozinho (`.pgrid.solo` do protótipo).
 *
 * @example <PibEmptyLayout data={panel} place="Caatinga" state="ok" onRetry={retry} onSelectUf={toggleUf} onSelectYear={pickYear} onReset={reset} />
 */
export const PibEmptyLayout = ({
  onSelectUf,
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
      data={card.data}
      state={card.state}
      onRetry={card.onRetry}
      onSelectUf={onSelectUf}
    />
  </div>
);
