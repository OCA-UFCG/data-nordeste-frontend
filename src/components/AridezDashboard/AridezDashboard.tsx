"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  AridezEmptyLayout,
  AridezGrids,
} from "@/components/AridezDashboard/AridezLayout";
import { ARIDEZ_CARD_SOURCE } from "@/components/AridezDashboard/aridezTexts";
import {
  ARIDEZ_MACROTHEME,
  ARIDEZ_SOURCE,
  ARIDEZ_TITLE,
} from "@/components/AridezDashboard/aridezTheme";
import { usePanelNavigation } from "@/components/Panel/filters/useTerritorialNavigation";
import {
  ProtoCardMenuContext,
  type ProtoCardMenuContextValue,
} from "@/components/ProtoPanel/ProtoCardMenu";
import {
  buildPosterBase,
  type PosterPanelInfo,
} from "@/components/ProtoPanel/posterBase";
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
} from "@/features/panels/territorialPlace";
import { posterPlace } from "@/features/panels/mapPosterBuild";
import { cn } from "@/lib/utils";

const YEARS = listYears(ARIDEZ_YEAR_RANGE);

const buildAridezSearch = (filters: TerritorialFilters): string =>
  buildTerritorialSearch(filters, ARIDEZ_YEAR_RANGE);

// O link de compartilhar leva os filtros da carga atual, com o caminho da página.
const useCardMenuValue = (
  data: AridezPanelData,
  pathname: string,
  catalogHref: string | null,
  { macroTheme = ARIDEZ_MACROTHEME, updatedAt }: PosterPanelInfo,
): ProtoCardMenuContextValue =>
  useMemo(
    () => ({
      share: {
        path: `${pathname}${buildAridezSearch(data.filters)}`,
        chips: describeTerritorialShareChips(data),
      },
      catalogHref,
      imageSource: ARIDEZ_CARD_SOURCE,
      poster: buildPosterBase({
        macroTheme,
        icon: "aridez",
        tone: "aridez",
        updatedAt,
        place: posterPlace(data),
        chips: describeTerritorialShareChips(data),
      }),
    }),
    [data, pathname, catalogHref, macroTheme, updatedAt],
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
 * `macroTheme` e `updatedAt` ("MM/AAAA") vão no cabeçalho e no rodapé da imagem
 * baixada do mapa.
 *
 * @example <AridezDashboard data={panel} catalogHref="/catalog?category=meio-ambiente" macroTheme="Meio Ambiente" updatedAt="11/2026" />
 */
export const AridezDashboard = ({
  data,
  failed = false,
  catalogHref,
  macroTheme,
  updatedAt,
}: PosterPanelInfo & {
  data: AridezPanelData;
  failed?: boolean;
  catalogHref: string | null;
}) => {
  const { isPending, pathname, applyFilters } =
    usePanelNavigation(buildAridezSearch);
  const { retrying, retry } = useProtoRetry();
  const sticky = useProtoSticky();
  const cardMenu = useCardMenuValue(data, pathname, catalogHref, {
    macroTheme,
    updatedAt,
  });
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
    onFiltersChange: request,
  };
  const showEmpty = !failed && !data.areas;

  return (
    <ProtoToneContext.Provider value="aridez">
      <ProtoTerritorialFilters
        brand={{ icon: "aridez", title: ARIDEZ_TITLE }}
        brandInBar
        data={{ ...data, filters: selection }}
        years={YEARS}
        onChange={request}
        onClear={reset}
        isDefault={isDefaultTerritorialFilters(selection, ARIDEZ_YEAR_RANGE)}
        top={sticky.filterTop}
        stuck={sticky.stuck}
        barRef={sticky.filterRef}
      />
      <div
        style={protoToneStyle("aridez")}
        className={`${PROTO_TEXT} mx-auto flex w-full max-w-[1440px] px-20 pt-8 pb-10 max-[1100px]:px-8 max-[1100px]:pt-6 max-[700px]:px-4 max-[700px]:pt-5 max-[700px]:pb-8`}
      >
        {/* Mesmo espaço até os cards que no Perfil: 24 px, 16 no celular. */}
        {showEmpty ? null : (
          <div className="mb-6 max-[700px]:mb-4">
            <ProtoVejaMais
              analysis={buildAnalise(data)}
              state={states.bigNumbers}
            />
          </div>
        )}
        <ProtoCardMenuContext.Provider value={cardMenu}>
          {showEmpty ? (
            <AridezEmptyLayout {...layout} onReset={reset} />
          ) : (
            <AridezGrids {...layout} />
          )}
        </ProtoCardMenuContext.Provider>
        <p className="mt-4 text-xs leading-4 text-grey-1100">{ARIDEZ_SOURCE}</p>
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
