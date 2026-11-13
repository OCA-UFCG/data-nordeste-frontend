"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PerfilFilterBar } from "@/components/DemografiaDashboard/PerfilFilterBar";
import {
  PerfilEmptyLayout,
  PerfilGrids,
} from "@/components/DemografiaDashboard/PerfilLayout";
import { DEMOGRAFIA_SOURCE } from "@/components/DemografiaDashboard/demografiaTheme";
import { PERFIL_CARD_SOURCE } from "@/components/DemografiaDashboard/perfilTexts";
import type { ProtoCardState } from "@/components/ProtoPanel/ProtoCard";
import {
  ProtoCardMenuContext,
  type ProtoCardMenuContextValue,
} from "@/components/ProtoPanel/ProtoCardMenu";
import {
  BUTTON,
  PROTO_TEXT,
  protoToneStyle,
} from "@/components/ProtoPanel/protoStyles";
import { ProtoToneContext } from "@/components/ProtoPanel/protoTone";
import { useProtoRetry } from "@/components/ProtoPanel/useProtoRetry";
import { useProtoSticky } from "@/components/ProtoPanel/useProtoSticky";
import { usePanelNavigation } from "@/components/Panel/filters/useTerritorialNavigation";
import {
  DEMOGRAFIA_YEAR_RANGE,
  type DemografiaPanelData,
} from "@/features/panels/demografia/demografiaPanel";
import {
  describePerfilPlace,
  describePerfilShareChips,
  isDefaultPerfilFilters,
  togglePerfilUf,
} from "@/features/panels/demografia/perfilPlace";
import { findPerfilPopulacao } from "@/features/panels/demografia/perfilPopulacao";
import {
  buildTerritorialSearch,
  defaultTerritorialFilters,
  type TerritorialFilters,
} from "@/features/panels/territorialFilters";
import { cn } from "@/lib/utils";

const buildPerfilSearch = (filters: TerritorialFilters): string =>
  buildTerritorialSearch(filters, DEMOGRAFIA_YEAR_RANGE);

// O link de compartilhar leva os filtros da carga atual, com o caminho da página.
const useCardMenuValue = (
  data: DemografiaPanelData,
  pathname: string,
  catalogHref: string | null,
): ProtoCardMenuContextValue =>
  useMemo(
    () => ({
      share: {
        path: `${pathname}${buildPerfilSearch(data.filters)}`,
        chips: describePerfilShareChips(data),
      },
      catalogHref,
      imageSource: PERFIL_CARD_SOURCE,
    }),
    [data, pathname, catalogHref],
  );

/**
 * Painel de perfil demográfico no formato do protótipo: barra de filtros,
 * grade de cards e a fonte com o catálogo. `failed`: a consulta falhou e os
 * cards mostram o erro com "Tentar de novo". Sem população no ano escolhido,
 * mostra o aviso e o mapa.
 *
 * @example <DemografiaDashboard data={panel} catalogHref="/catalog?category=demografia" />
 */
export const DemografiaDashboard = ({
  data,
  failed = false,
  catalogHref,
}: {
  data: DemografiaPanelData;
  failed?: boolean;
  catalogHref: string | null;
}) => {
  const { isPending, pathname, applyFilters } =
    usePanelNavigation(buildPerfilSearch);
  const { retrying, retry } = useProtoRetry();
  const sticky = useProtoSticky();
  const cardMenu = useCardMenuValue(data, pathname, catalogHref);
  const state: ProtoCardState = failed
    ? "error"
    : isPending || retrying
      ? "loading"
      : "ok";
  const reset = () =>
    applyFilters(defaultTerritorialFilters(DEMOGRAFIA_YEAR_RANGE));
  const layout = {
    data,
    place: describePerfilPlace(data),
    state,
    onRetry: retry,
    onSelectUf: (uf: string) => applyFilters(togglePerfilUf(data.filters, uf)),
    onReset: reset,
  };
  const showEmpty = !failed && findPerfilPopulacao(data) === null;

  return (
    <ProtoToneContext.Provider value="perfil">
      <PerfilFilterBar
        data={data}
        onChange={applyFilters}
        onClear={reset}
        isDefault={isDefaultPerfilFilters(data.filters, DEMOGRAFIA_YEAR_RANGE)}
        top={sticky.filterTop}
        stuck={sticky.stuck}
        barRef={sticky.filterRef}
      />
      <div
        style={protoToneStyle("perfil")}
        className={`${PROTO_TEXT} mx-auto w-full max-w-[1440px] px-20 pt-8 pb-10 max-[1100px]:px-8 max-[1100px]:pt-6 max-[700px]:px-4 max-[700px]:pt-5 max-[700px]:pb-8`}
      >
        <ProtoCardMenuContext.Provider value={cardMenu}>
          {showEmpty ? (
            <PerfilEmptyLayout {...layout} />
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
