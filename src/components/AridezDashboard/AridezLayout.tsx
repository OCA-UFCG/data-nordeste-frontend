import { AridezBigNumbers } from "@/components/AridezDashboard/AridezBigNumbers";
import type { AridezCardProps } from "@/components/AridezDashboard/aridezCardProps";
import { AridezClassCard } from "@/components/AridezDashboard/AridezClassCard";
import { AridezMapCard } from "@/components/AridezDashboard/AridezMapCard";
import { AridezMunicipiosCard } from "@/components/AridezDashboard/AridezMunicipiosCard";
import {
  PROTO_CARD_CLASS,
  ProtoCardNotice,
} from "@/components/ProtoPanel/ProtoCard";
import type { AridezCardStates } from "@/features/panels/aridez/aridezCardState";
import { ARIDEZ_YEAR_RANGE } from "@/features/panels/aridez/aridezPanel";
import type { TerritorialFilters } from "@/features/panels/territorialFilters";
import { describeDefaultPlaceLabel } from "@/features/panels/territorialPlace";

type AridezLayoutProps = Omit<AridezCardProps, "state"> & {
  states: AridezCardStates;

  // Filtros pedidos (iguais a `data.filters` fora da navegação): os estados
  // destacados no mapa já mostram o pedido.
  selection: TerritorialFilters;
  onSelectUf: (uf: string) => void;
  onReset: () => void;
};

const BOTTOM_GRID =
  "grid grid-cols-2 items-stretch gap-6 max-[1000px]:grid-cols-1 max-[1000px]:gap-4";

const MapCard = ({
  selection,
  states,
  onSelectUf,
  data,
  onRetry,
}: Omit<AridezLayoutProps, "onReset" | "place">) => (
  <AridezMapCard
    data={data}
    selectedUfs={selection.uf ?? []}
    state={states.map}
    onRetry={onRetry}
    onSelectUf={onSelectUf}
  />
);

/**
 * Grade do painel de aridez (`.arid-stack` do protótipo): números de destaque,
 * o mapa por estado e, lado a lado, as classes e os municípios.
 *
 * @example <AridezGrids data={panel} selection={filters} place="Nordeste" states={states} onRetry={retry} onSelectUf={selectUf} />
 */
export const AridezGrids = ({
  states,
  ...props
}: Omit<AridezLayoutProps, "onReset">) => (
  <div className="flex flex-col gap-4">
    <AridezBigNumbers
      data={props.data}
      state={states.bigNumbers}
      onRetry={props.onRetry}
    />
    <MapCard {...props} states={states} />
    <div className={BOTTOM_GRID}>
      <AridezClassCard {...props} state={states.classes} />
      <AridezMunicipiosCard {...props} state={states.municipios} />
    </div>
  </div>
);

/**
 * Sem área classificada no território e ano escolhidos: o aviso com o atalho
 * para o padrão do painel e o mapa sozinho, como no PIB.
 *
 * @example <AridezEmptyLayout data={panel} selection={filters} place="Recife (PE)" states={states} onRetry={retry} onSelectUf={selectUf} onReset={reset} />
 */
export const AridezEmptyLayout = ({ onReset, ...props }: AridezLayoutProps) => (
  <div className="flex flex-col gap-4">
    <article className={PROTO_CARD_CLASS}>
      <ProtoCardNotice
        tone="warn"
        action={{
          label: describeDefaultPlaceLabel(ARIDEZ_YEAR_RANGE),
          onClick: onReset,
        }}
      >
        <b>ATENÇÃO:</b> não há dados para{" "}
        <b>{`${props.place} · ${props.data.filters.ano}`}</b>.
      </ProtoCardNotice>
    </article>
    <MapCard {...props} />
  </div>
);
