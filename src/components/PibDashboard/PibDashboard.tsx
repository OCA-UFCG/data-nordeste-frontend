"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePanelNavigation } from "@/components/Panel/filters/useTerritorialNavigation";
import { PibEmptyLayout, PibGrids } from "@/components/PibDashboard/PibLayout";
import { PIB_CARD_SOURCE } from "@/components/PibDashboard/pibTexts";
import { PIB_SOURCE } from "@/components/PibDashboard/pibTheme";
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
import { ProtoTerritorialFilters } from "@/components/ProtoPanel/ProtoTerritorialFilters";
import { ProtoToneContext } from "@/components/ProtoPanel/protoTone";
import { useProtoRetry } from "@/components/ProtoPanel/useProtoRetry";
import { useProtoSticky } from "@/components/ProtoPanel/useProtoSticky";
import {
  PIB_MAX_PLACES,
  PIB_YEAR_RANGE,
  type PibPanelData,
} from "@/features/panels/pib/pibPanel";
import {
  buildTerritorialSearch,
  defaultTerritorialFilters,
  listYears,
  type TerritorialFilters,
} from "@/features/panels/territorialFilters";
import {
  describeTerritorialPlace,
  describeTerritorialShareChips,
  isDefaultTerritorialFilters,
  toggleTerritorialUf,
} from "@/features/panels/territorialPlace";
import { cn } from "@/lib/utils";

const YEARS = listYears(PIB_YEAR_RANGE);

const buildPibSearch = (filters: TerritorialFilters): string =>
  buildTerritorialSearch(filters, PIB_YEAR_RANGE);

// O link de compartilhar leva os filtros da carga atual, com o caminho da página.
const useCardMenuValue = (
  data: PibPanelData,
  pathname: string,
  catalogHref: string | null,
): ProtoCardMenuContextValue =>
  useMemo(
    () => ({
      share: {
        path: `${pathname}${buildPibSearch(data.filters)}`,
        chips: describeTerritorialShareChips(data),
      },
      catalogHref,
      imageSource: PIB_CARD_SOURCE,
    }),
    [data, pathname, catalogHref],
  );

/**
 * Painel do PIB no formato do protótipo: barra de filtros, grade de cards e a
 * fonte com o catálogo. `failed`: a consulta falhou e os cards mostram o erro
 * com "Tentar de novo". Sem PIB no território e ano escolhidos, mostra o
 * aviso e o mapa.
 *
 * @example <PibDashboard data={panel} catalogHref="/catalog?category=economia-e-renda" />
 */
export const PibDashboard = ({
  data,
  failed = false,
  catalogHref,
}: {
  data: PibPanelData;
  failed?: boolean;
  catalogHref: string | null;
}) => {
  const { isPending, pathname, applyFilters } =
    usePanelNavigation(buildPibSearch);
  const { retrying, retry } = useProtoRetry();
  const sticky = useProtoSticky();
  const cardMenu = useCardMenuValue(data, pathname, catalogHref);
  const state: ProtoCardState = failed
    ? "error"
    : isPending || retrying
      ? "loading"
      : "ok";
  const reset = () => applyFilters(defaultTerritorialFilters(PIB_YEAR_RANGE));
  const layout = {
    data,
    place: describeTerritorialPlace(data),
    state,
    onRetry: retry,
    onSelectUf: (uf: string) =>
      applyFilters(toggleTerritorialUf(data.filters, uf)),
    onSelectYear: (ano: number) => applyFilters({ ...data.filters, ano }),
  };
  const showEmpty = !failed && data.serie.length === 0;

  return (
    <ProtoToneContext.Provider value="pib">
      <ProtoTerritorialFilters
        data={data}
        years={YEARS}
        maxPlaces={PIB_MAX_PLACES}
        onChange={applyFilters}
        onClear={reset}
        isDefault={isDefaultTerritorialFilters(data.filters, PIB_YEAR_RANGE)}
        top={sticky.filterTop}
        stuck={sticky.stuck}
        barRef={sticky.filterRef}
      />
      <div
        style={protoToneStyle("pib")}
        className={`${PROTO_TEXT} mx-auto w-full max-w-[1440px] px-20 pt-8 pb-10 max-[1100px]:px-8 max-[1100px]:pt-6 max-[700px]:px-4 max-[700px]:pt-5 max-[700px]:pb-8`}
      >
        <ProtoCardMenuContext.Provider value={cardMenu}>
          {showEmpty ? (
            <PibEmptyLayout {...layout} onReset={reset} />
          ) : (
            <PibGrids {...layout} />
          )}
        </ProtoCardMenuContext.Provider>
        <p className="mt-4 text-xs leading-4 text-grey-1100">{PIB_SOURCE}</p>
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
