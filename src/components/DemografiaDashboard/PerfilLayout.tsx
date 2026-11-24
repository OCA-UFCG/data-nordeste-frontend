import type { ReactNode } from "react";
import { PerfilBigNumber } from "@/components/DemografiaDashboard/PerfilBigNumber";
import { PerfilCorRacaCard } from "@/components/DemografiaDashboard/PerfilCorRacaCard";
import type { PerfilCardProps } from "@/components/DemografiaDashboard/perfilCardProps";
import { PerfilMunicipiosCard } from "@/components/DemografiaDashboard/PerfilMunicipiosCard";
import { PerfilPiramideCard } from "@/components/DemografiaDashboard/PerfilPiramideCard";
import {
  PerfilPorteMapCard,
  type PorteMapView,
} from "@/components/DemografiaDashboard/PerfilPorteMapCard";
import { PerfilSerieCard } from "@/components/DemografiaDashboard/PerfilSerieCard";
import { PerfilSexoCard } from "@/components/DemografiaDashboard/PerfilSexoCard";
import {
  PROTO_CARD_CLASS,
  ProtoCardNotice,
} from "@/components/ProtoPanel/ProtoCard";
import type { PerfilCardStates } from "@/features/panels/demografia/perfilCardState";
import type { TerritorialFilters } from "@/features/panels/territorialFilters";

type PerfilGridsProps = Omit<PerfilCardProps, "state"> & {
  states: PerfilCardStates;

  // Filtros pedidos (iguais a `data.filters` fora da navegação): os estados
  // destacados no mapa já mostram o pedido.
  selection: TerritorialFilters;
  mapView: PorteMapView;
  onSelectUf: (uf: string) => void;
};

// `resetLabel`: o atalho para o padrão ("Ver Nordeste · 2022"), com o ano do banco.
export type PerfilLayoutProps = PerfilGridsProps & {
  onReset: () => void;
  resetLabel: string;
};

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
  "grid grid-cols-[360px_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] gap-4 items-stretch [grid-template-areas:'bn_map'_'mun_map'_'sex_age'] max-[1000px]:flex max-[1000px]:flex-col";

// `.dg2` do protótipo: série temporal e cor ou raça, lado a lado.
const BOTTOM_GRID =
  "mt-4 grid grid-cols-2 gap-4 max-[1000px]:flex max-[1000px]:flex-col";

/**
 * Grade do perfil demográfico (`.dg` e `.dg2` do protótipo): os seis cards
 * nas áreas da grade. Cada card recebe o `PerfilCardProps` com o seu estado.
 *
 * @example <PerfilGrids data={panel} place="Nordeste" states={states} selection={filters} mapView={porteView} onRetry={retry} onSelectUf={select} />
 */
export const PerfilGrids = ({
  states,
  selection,
  mapView,
  onSelectUf,
  ...card
}: PerfilGridsProps) => (
  <div>
    <div className={TOP_GRID}>
      <Slot className="[grid-area:bn] max-[1000px]:order-1">
        <PerfilBigNumber
          data={card.data}
          state={states.bigNumber}
          onRetry={card.onRetry}
        />
      </Slot>
      <Slot className="[grid-area:sex] max-[1000px]:order-2">
        <PerfilSexoCard {...card} state={states.sexo} />
      </Slot>
      <Slot className="[grid-area:age] max-[1000px]:order-3">
        <PerfilPiramideCard {...card} state={states.piramide} />
      </Slot>
      <Slot className="[grid-area:map] max-[1000px]:order-4">
        <PerfilPorteMapCard
          {...card}
          state={states.map}
          selectedUfs={selection.uf ?? []}
          mapView={mapView}
          onSelectUf={onSelectUf}
        />
      </Slot>
      <Slot className="[grid-area:mun] max-[1000px]:order-5">
        <PerfilMunicipiosCard {...card} state={states.municipios} />
      </Slot>
    </div>
    <div className={BOTTOM_GRID}>
      <Slot className="">
        <PerfilSerieCard {...card} state={states.serie} />
      </Slot>
      <Slot className="">
        <PerfilCorRacaCard {...card} state={states.corRaca} />
      </Slot>
    </div>
  </div>
);

// Sem população no ano escolhido: um aviso com o atalho para o padrão e o
// mapa sozinho.
export const PerfilEmptyLayout = ({
  states,
  selection,
  mapView,
  onSelectUf,
  onReset,
  resetLabel,
  ...card
}: PerfilLayoutProps) => (
  <div>
    <article className={PROTO_CARD_CLASS}>
      <ProtoCardNotice
        tone="warn"
        action={{ label: resetLabel, onClick: onReset }}
      >
        <b>ATENÇÃO:</b> não há dados para{" "}
        <b>{`${card.place} · ${card.data.filters.ano}`}</b>.
      </ProtoCardNotice>
    </article>
    <Slot className="mt-4">
      <PerfilPorteMapCard
        {...card}
        state={states.map}
        selectedUfs={selection.uf ?? []}
        mapView={mapView}
        onSelectUf={onSelectUf}
      />
    </Slot>
  </div>
);
