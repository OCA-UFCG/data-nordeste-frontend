import type { ReactNode } from "react";
import { PerfilBigNumber } from "@/components/DemografiaDashboard/PerfilBigNumber";
import { PerfilCorRacaCard } from "@/components/DemografiaDashboard/PerfilCorRacaCard";
import type { PerfilCardProps } from "@/components/DemografiaDashboard/perfilCardProps";
import { PerfilMunicipiosCard } from "@/components/DemografiaDashboard/PerfilMunicipiosCard";
import { PerfilPiramideCard } from "@/components/DemografiaDashboard/PerfilPiramideCard";
import { PerfilPorteMapCard } from "@/components/DemografiaDashboard/PerfilPorteMapCard";
import { PerfilSerieCard } from "@/components/DemografiaDashboard/PerfilSerieCard";
import { PerfilSexoCard } from "@/components/DemografiaDashboard/PerfilSexoCard";
import { ProtoCardNotice } from "@/components/ProtoPanel/ProtoCard";
import { CARD_SHADOW } from "@/components/ProtoPanel/protoStyles";
import { DEMOGRAFIA_YEAR_RANGE } from "@/features/panels/demografia/demografiaPanel";
import { describeDefaultPlaceLabel } from "@/features/panels/territorialPlace";

type PerfilMapProps = { onSelectUf: (uf: string) => void };

export type PerfilLayoutProps = PerfilCardProps &
  PerfilMapProps & { onReset: () => void };

// Célula da grade: a coluna ou linha ocupa a altura toda, e o card a preenche.
const Slot = ({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) => (
  <div className={`flex min-w-0 flex-col [&>*]:flex-1 ${className}`}>
    {children}
  </div>
);

// `.dg` do protótipo: número de destaque, mapa, municípios, sexo e pirâmide.
// Abaixo de 1000 px vira uma coluna só, na ordem que o protótipo usa no celular.
const TOP_GRID =
  "grid grid-cols-[302px_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] gap-4 items-stretch [grid-template-areas:'bn_map'_'mun_map'_'sex_age'] max-[1000px]:flex max-[1000px]:flex-col";

// `.dg2` do protótipo: série temporal e cor ou raça, lado a lado.
const BOTTOM_GRID =
  "mt-4 grid grid-cols-2 gap-4 max-[1000px]:flex max-[1000px]:flex-col";

/**
 * Grade do perfil demográfico (`.dg` e `.dg2` do protótipo): os seis cards
 * nas áreas da grade. Cada card recebe o mesmo `PerfilCardProps`.
 *
 * @example <PerfilGrids data={panel} place="Nordeste" state="ok" onRetry={retry} onSelectUf={select} onReset={reset} />
 */
export const PerfilGrids = ({
  onSelectUf,
  ...card
}: PerfilCardProps & PerfilMapProps) => (
  <div>
    <div className={TOP_GRID}>
      <Slot className="[grid-area:bn] max-[1000px]:order-1">
        <PerfilBigNumber
          data={card.data}
          state={card.state}
          onRetry={card.onRetry}
        />
      </Slot>
      <Slot className="[grid-area:sex] max-[1000px]:order-2">
        <PerfilSexoCard {...card} />
      </Slot>
      <Slot className="[grid-area:age] max-[1000px]:order-3">
        <PerfilPiramideCard {...card} />
      </Slot>
      <Slot className="[grid-area:map] max-[1000px]:order-4">
        <PerfilPorteMapCard {...card} onSelectUf={onSelectUf} />
      </Slot>
      <Slot className="[grid-area:mun] max-[1000px]:order-5">
        <PerfilMunicipiosCard {...card} />
      </Slot>
    </div>
    <div className={BOTTOM_GRID}>
      <Slot className="">
        <PerfilSerieCard {...card} />
      </Slot>
      <Slot className="">
        <PerfilCorRacaCard {...card} />
      </Slot>
    </div>
  </div>
);

// Sem população no ano escolhido: um aviso com os dois atalhos e o mapa sozinho.
export const PerfilEmptyLayout = ({
  onSelectUf,
  onReset,
  ...card
}: PerfilLayoutProps) => (
  <div>
    <article
      className={`flex min-w-0 flex-col rounded-[8px] border border-grey-300 bg-white px-5 py-4 ${CARD_SHADOW} max-[700px]:p-4`}
    >
      <ProtoCardNotice
        tone="warn"
        action={{
          label: describeDefaultPlaceLabel(DEMOGRAFIA_YEAR_RANGE),
          onClick: onReset,
        }}
        secondaryAction={{ label: "Limpar filtros", onClick: onReset }}
      >
        <b>ATENÇÃO:</b> não há dados para{" "}
        <b>{`${card.place} · ${card.data.filters.ano}`}</b>.
      </ProtoCardNotice>
    </article>
    <Slot className="mt-4">
      <PerfilPorteMapCard {...card} onSelectUf={onSelectUf} />
    </Slot>
  </div>
);
