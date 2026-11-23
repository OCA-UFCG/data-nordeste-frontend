"use client";

import { useCallback } from "react";
import { usePanelNavigation } from "@/components/Panel/filters/useTerritorialNavigation";
import {
  buildIdhSearch,
  type IdhFilters,
} from "@/features/panels/idh/idhPanel";
import type { YearRange } from "@/features/panels/territorialFilters";

/**
 * Navegação dos painéis de IDH: filtrar consulta o servidor; `showVisao` só
 * troca a aba na URL (replaceState), sem consultar o banco de novo.
 *
 * @example const { applyFilters, showVisao } = useIdhNavigation(panel.yearRange);
 */
export const useIdhNavigation = (range: YearRange) => {
  const buildSearch = useCallback(
    (filters: IdhFilters) => buildIdhSearch(filters, range),
    [range],
  );
  const { isPending, pathname, applyFilters } = usePanelNavigation(buildSearch);
  const showVisao = useCallback(
    (filters: IdhFilters) =>
      window.history.replaceState(
        null,
        "",
        `${pathname}${buildSearch(filters)}`,
      ),
    [pathname, buildSearch],
  );

  return { isPending, pathname, applyFilters, showVisao };
};
