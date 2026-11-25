"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePanelNavigation } from "@/components/Panel/filters/useTerritorialNavigation";
import { PibEmptyLayout, PibGrids } from "@/components/PibDashboard/PibLayout";
import { PIB_CARD_SOURCE } from "@/components/PibDashboard/pibTexts";
import {
  PIB_ICON,
  PIB_SHORT_TITLE,
  PIB_SOURCE,
} from "@/components/PibDashboard/pibTheme";
import { usePibYearField } from "@/components/PibDashboard/usePibYearField";
import {
  ProtoCardMenuContext,
  type ProtoCardMenuContextValue,
} from "@/components/ProtoPanel/ProtoCardMenu";
import {
  BUTTON,
  PROTO_TEXT,
  protoToneStyle,
  WRAP,
} from "@/components/ProtoPanel/protoStyles";
import { ProtoTerritorialFilters } from "@/components/ProtoPanel/ProtoTerritorialFilters";
import { ProtoToneContext } from "@/components/ProtoPanel/protoTone";
import { usePendingFilters } from "@/components/ProtoPanel/usePendingFilters";
import { useProtoRetry } from "@/components/ProtoPanel/useProtoRetry";
import { useProtoSticky } from "@/components/ProtoPanel/useProtoSticky";
import {
  type PibCardStates,
  resolvePibCardStates,
} from "@/features/panels/pib/pibCardState";
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
} from "@/features/panels/territorialPlace";
import { cn } from "@/lib/utils";

const YEARS = listYears(PIB_YEAR_RANGE);

const LOADING_STATES: PibCardStates = {
  bigNumbers: "loading",
  evolution: "loading",
  map: "loading",
  sectors: "loading",
};

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
      bareSheet: true,
    }),
    [data, pathname, catalogHref],
  );

/**
 * Painel do PIB no formato do protótipo: barra de filtros, grade de cards e a
 * fonte com o catálogo. `failed`: a consulta falhou e os cards mostram o erro
 * com "Tentar de novo". Sem PIB no território e ano escolhidos, mostra o
 * aviso e o mapa. `loading`: a página ainda carrega (`loading.tsx`) e todos
 * os cards mostram o esqueleto.
 *
 * @example <PibDashboard data={panel} catalogHref="/catalog?category=economia-e-renda" />
 */
export const PibDashboard = ({
  data,
  failed = false,
  loading = false,
  catalogHref,
}: {
  data: PibPanelData;
  failed?: boolean;
  loading?: boolean;
  catalogHref: string | null;
}) => {
  const { isPending, pathname, applyFilters } =
    usePanelNavigation(buildPibSearch);
  const { retrying, retry } = useProtoRetry();
  const sticky = useProtoSticky();
  const cardMenu = useCardMenuValue(data, pathname, catalogHref);
  const yearField = usePibYearField();

  // Como no IDH: a seleção mostra o filtro pedido na hora, e só o card cujo
  // dado muda fica esmaecido, sem o painel inteiro virar esqueleto.
  const { pending, selection, request } = usePendingFilters(
    data.filters,
    applyFilters,
    isPending,
  );
  const states = loading
    ? LOADING_STATES
    : resolvePibCardStates({ failed, retrying, pending }, data.filters);
  const reset = () => request(defaultTerritorialFilters(PIB_YEAR_RANGE));
  const layout = {
    data,
    selection,
    place: describeTerritorialPlace(data),
    states,
    onRetry: retry,
    onFiltersChange: request,
    onSelectYear: (ano: number) => request({ ...selection, ano }),
    onShowSectorYear: (ano: number) => {
      request({ ...selection, ano });
      yearField.flashYear();
    },
    onPickYear: yearField.pickYear,
  };
  const showEmpty = !failed && !loading && data.serie.length === 0;

  return (
    <ProtoToneContext.Provider value="pib">
      <ProtoTerritorialFilters
        brand={{ icon: PIB_ICON, title: PIB_SHORT_TITLE }}
        fillRow
        disabled={loading}
        yearRef={yearField.yearRef}
        sheetOpen={yearField.sheetOpen}
        onSheetOpenChange={yearField.setSheetOpen}
        data={{ ...data, filters: selection }}
        years={YEARS}
        maxPlaces={PIB_MAX_PLACES}
        onChange={request}
        onClear={reset}
        isDefault={isDefaultTerritorialFilters(selection, PIB_YEAR_RANGE)}
        top={sticky.filterTop}
        stuck={sticky.stuck}
        barRef={sticky.filterRef}
      />
      <div
        style={protoToneStyle("pib")}
        className={`${PROTO_TEXT} ${WRAP} pt-8 pb-10 max-[1100px]:pt-6 max-[700px]:pt-5 max-[700px]:pb-8`}
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
