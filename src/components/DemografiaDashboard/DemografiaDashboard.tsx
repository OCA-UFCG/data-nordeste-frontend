"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  PerfilEmptyLayout,
  PerfilGrids,
} from "@/components/DemografiaDashboard/PerfilLayout";
import {
  DEMOGRAFIA_BAR_TITLE,
  DEMOGRAFIA_SOURCE,
} from "@/components/DemografiaDashboard/demografiaTheme";
import { usePorteMapView } from "@/components/DemografiaDashboard/PerfilPorteMapCard";
import { PERFIL_CARD_SOURCE } from "@/components/DemografiaDashboard/perfilTexts";
import {
  ProtoCardMenuContext,
  type ProtoCardMenuContextValue,
} from "@/components/ProtoPanel/ProtoCardMenu";
import {
  BUTTON,
  PROTO_TEXT,
  protoToneStyle,
} from "@/components/ProtoPanel/protoStyles";
import { ProtoTerritorialFilters } from "@/components/ProtoPanel/ProtoTerritorialFilters";
import { ProtoToneContext } from "@/components/ProtoPanel/protoTone";
import { ProtoVejaMais } from "@/components/ProtoPanel/ProtoVejaMais";
import { usePendingFilters } from "@/components/ProtoPanel/usePendingFilters";
import { useProtoRetry } from "@/components/ProtoPanel/useProtoRetry";
import { useProtoSticky } from "@/components/ProtoPanel/useProtoSticky";
import { usePanelNavigation } from "@/components/Panel/filters/useTerritorialNavigation";
import { buildDemografiaAnalise } from "@/features/panels/demografia/demografiaAnalise";
import { type DemografiaPanelData } from "@/features/panels/demografia/demografiaPanel";
import {
  describeDefaultPlaceLabel,
  describeTerritorialPlace,
  describeTerritorialShareChips,
  isDefaultTerritorialFilters,
} from "@/features/panels/territorialPlace";
import { resolvePerfilCardStates } from "@/features/panels/demografia/perfilCardState";
import { findPerfilPopulacao } from "@/features/panels/demografia/perfilPopulacao";
import {
  buildTerritorialSearch,
  defaultTerritorialFilters,
  listYears,
  type TerritorialFilters,
  type YearRange,
} from "@/features/panels/territorialFilters";
import { cn } from "@/lib/utils";

const BRAND = { icon: "users", title: DEMOGRAFIA_BAR_TITLE } as const;

// O link de compartilhar leva os filtros da carga atual, com o caminho da página.
const useCardMenuValue = (
  data: DemografiaPanelData,
  search: string,
  pathname: string,
  catalogHref: string | null,
): ProtoCardMenuContextValue =>
  useMemo(
    () => ({
      share: {
        path: `${pathname}${search}`,
        chips: describeTerritorialShareChips(data),
      },
      catalogHref,
      imageSource: PERFIL_CARD_SOURCE,
    }),
    [data, search, pathname, catalogHref],
  );

/**
 * Painel de perfil demográfico no formato do protótipo: barra de filtros com
 * a marca, "Veja mais", grade de cards e a fonte com o catálogo. `years`: os
 * censos do banco. `failed`: a consulta falhou e os cards mostram o erro com
 * "Tentar de novo". Sem população no ano escolhido, mostra o aviso e o mapa.
 *
 * @example <DemografiaDashboard data={panel} years={range} catalogHref="/catalog?category=demografia" />
 */
export const DemografiaDashboard = ({
  data,
  years,
  failed = false,
  catalogHref,
}: {
  data: DemografiaPanelData;
  years: YearRange;
  failed?: boolean;
  catalogHref: string | null;
}) => {
  const buildSearch = (filters: TerritorialFilters) =>
    buildTerritorialSearch(filters, years);
  const { isPending, pathname, applyFilters } = usePanelNavigation(buildSearch);
  const { retrying, retry } = useProtoRetry();
  const sticky = useProtoSticky();
  const cardMenu = useCardMenuValue(
    data,
    buildSearch(data.filters),
    pathname,
    catalogHref,
  );
  const mapView = usePorteMapView();

  // Como no IDH e no PIB: a seleção mostra o filtro pedido na hora, e só o
  // card cujo dado muda fica esmaecido, sem o painel inteiro virar esqueleto.
  const { pending, selection, request } = usePendingFilters(
    data.filters,
    applyFilters,
    isPending,
  );
  const reset = () => request(defaultTerritorialFilters(years));
  const place = describeTerritorialPlace(data);
  const layout = {
    data,
    selection,
    mapView,
    place,
    states: resolvePerfilCardStates(
      { failed, retrying, pending },
      data.filters,
    ),
    onRetry: retry,
    onFiltersChange: request,
    onReset: reset,
  };
  const showEmpty = !failed && findPerfilPopulacao(data) === null;

  return (
    <ProtoToneContext.Provider value="perfil">
      <ProtoTerritorialFilters
        brand={BRAND}
        brandInBar
        data={{ ...data, filters: selection }}
        years={listYears(years)}
        onChange={request}
        onClear={reset}
        isDefault={isDefaultTerritorialFilters(selection, years)}
        top={sticky.filterTop}
        stuck={sticky.stuck}
        barRef={sticky.filterRef}
      />
      <div
        style={protoToneStyle("perfil")}
        className={`${PROTO_TEXT} mx-auto w-full max-w-[1440px] px-20 pt-8 pb-10 max-[1100px]:px-8 max-[1100px]:pt-6 max-[700px]:px-4 max-[700px]:pt-5 max-[700px]:pb-8`}
      >
        <div className="mb-6 max-[700px]:mb-4">
          <ProtoVejaMais
            analysis={showEmpty ? null : buildDemografiaAnalise(data, place)}
            state={layout.states.corRaca}
          />
        </div>
        <ProtoCardMenuContext.Provider value={cardMenu}>
          {showEmpty ? (
            <PerfilEmptyLayout
              {...layout}
              resetLabel={describeDefaultPlaceLabel(years)}
            />
          ) : (
            <PerfilGrids {...layout} />
          )}
        </ProtoCardMenuContext.Provider>
        <p className="mt-4 text-xs leading-4 text-grey-1100">
          {DEMOGRAFIA_SOURCE}
        </p>
        <Link
          href={catalogHref ?? "/catalog"}
          className={cn(BUTTON, "mt-4 flex w-full")}
        >
          Acessar o catálogo de dados
        </Link>
      </div>
    </ProtoToneContext.Provider>
  );
};
