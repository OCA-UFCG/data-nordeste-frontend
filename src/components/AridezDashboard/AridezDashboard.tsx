"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  AridezEmptyLayout,
  AridezGrids,
} from "@/components/AridezDashboard/AridezLayout";
import { ARIDEZ_CARD_SOURCE } from "@/components/AridezDashboard/aridezTexts";
import {
  ARIDEZ_SOURCE,
  ARIDEZ_TITLE,
} from "@/components/AridezDashboard/aridezTheme";
import { usePanelNavigation } from "@/components/Panel/filters/useTerritorialNavigation";
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
import { buildAridezAnalise } from "@/features/panels/aridez/aridezAnalise";
import { resolveAridezCardStates } from "@/features/panels/aridez/aridezCardState";
import {
  ARIDEZ_MAX_PLACES,
  ARIDEZ_YEAR_RANGE,
  type AridezPanelData,
} from "@/features/panels/aridez/aridezPanel";
import {
  buildTerritorialSearch,
  defaultTerritorialFilters,
  listYears,
  type TerritorialFilters,
} from "@/features/panels/territorialFilters";
import { describeSelectedTerritory } from "@/features/panels/territorialOptions";
import {
  describeTerritorialPlace,
  describeTerritorialShareChips,
  isDefaultTerritorialFilters,
  selectOnlyTerritorialUf,
} from "@/features/panels/territorialPlace";
import { cn } from "@/lib/utils";

const YEARS = listYears(ARIDEZ_YEAR_RANGE);

const buildAridezSearch = (filters: TerritorialFilters): string =>
  buildTerritorialSearch(filters, ARIDEZ_YEAR_RANGE);

// O link de compartilhar leva os filtros da carga atual, com o caminho da página.
const useCardMenuValue = (
  data: AridezPanelData,
  pathname: string,
  catalogHref: string | null,
): ProtoCardMenuContextValue =>
  useMemo(
    () => ({
      share: {
        path: `${pathname}${buildAridezSearch(data.filters)}`,
        chips: describeTerritorialShareChips(data),
      },
      catalogHref,
      imageSource: ARIDEZ_CARD_SOURCE,
    }),
    [data, pathname, catalogHref],
  );

// Texto do "Veja mais": o lugar curto vai na frase, o completo no rodapé.
const buildAnalise = (data: AridezPanelData) =>
  data.areas
    ? buildAridezAnalise({
        ano: data.filters.ano,
        areas: data.areas,
        baseAreas: data.baseAreas,
        place: describeSelectedTerritory(data),
        placeFull: describeTerritorialPlace(data),
      })
    : null;

/**
 * Painel de aridez no formato do protótipo: barra de filtros, "Veja mais",
 * grade de cards e a fonte com o catálogo. `failed`: a consulta falhou e os
 * cards mostram o erro com "Tentar de novo". Sem área classificada no
 * território e ano, mostra o aviso e o mapa.
 *
 * @example <AridezDashboard data={panel} catalogHref="/catalog?category=meio-ambiente" />
 */
export const AridezDashboard = ({
  data,
  failed = false,
  catalogHref,
}: {
  data: AridezPanelData;
  failed?: boolean;
  catalogHref: string | null;
}) => {
  const { isPending, pathname, applyFilters } =
    usePanelNavigation(buildAridezSearch);
  const { retrying, retry } = useProtoRetry();
  const sticky = useProtoSticky();
  const cardMenu = useCardMenuValue(data, pathname, catalogHref);
  const { pending, selection, request } = usePendingFilters(
    data.filters,
    applyFilters,
    isPending,
  );
  const states = resolveAridezCardStates(
    { failed, retrying, pending },
    data.filters,
  );
  const reset = () => request(defaultTerritorialFilters(ARIDEZ_YEAR_RANGE));
  const layout = {
    data,
    selection,
    place: describeTerritorialPlace(data),
    states,
    onRetry: retry,
    onSelectUf: (uf: string) => request(selectOnlyTerritorialUf(selection, uf)),
  };
  const showEmpty = !failed && !data.areas;

  return (
    <ProtoToneContext.Provider value="aridez">
      <ProtoTerritorialFilters
        brand={{ icon: "aridez", title: ARIDEZ_TITLE }}
        brandInBar
        data={{ ...data, filters: selection }}
        years={YEARS}
        maxPlaces={ARIDEZ_MAX_PLACES}
        onChange={request}
        onClear={reset}
        isDefault={isDefaultTerritorialFilters(selection, ARIDEZ_YEAR_RANGE)}
        top={sticky.filterTop}
        stuck={sticky.stuck}
        barRef={sticky.filterRef}
      />
      <div
        style={protoToneStyle("aridez")}
        className={`${PROTO_TEXT} mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-20 pt-8 pb-10 max-[1100px]:px-8 max-[1100px]:pt-6 max-[700px]:px-4 max-[700px]:pt-5 max-[700px]:pb-8`}
      >
        {showEmpty ? null : (
          <ProtoVejaMais
            analysis={buildAnalise(data)}
            state={states.bigNumbers}
          />
        )}
        <ProtoCardMenuContext.Provider value={cardMenu}>
          {showEmpty ? (
            <AridezEmptyLayout {...layout} onReset={reset} />
          ) : (
            <AridezGrids {...layout} />
          )}
        </ProtoCardMenuContext.Provider>
        <p className="text-xs leading-4 text-grey-1100">{ARIDEZ_SOURCE}</p>
        <Link
          href={catalogHref ?? "/catalog"}
          className={cn(BUTTON, "flex w-full")}
        >
          Acessar o catálogo de dados
        </Link>
      </div>
    </ProtoToneContext.Provider>
  );
};
