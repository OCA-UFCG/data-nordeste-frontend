"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import {
  buildTerritorialSearch,
  type TerritorialFilters,
  type YearRange,
} from "@/features/panels/territorialFilters";

// Troca os filtros na URL e deixa o server component recarregar os dados.
export const usePanelNavigation = <Filters>(
  buildSearch: (filters: Filters) => string,
) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const applyFilters = useCallback(
    (next: Filters) =>
      startTransition(() =>
        router.replace(`${pathname}${buildSearch(next)}`, { scroll: false }),
      ),
    [pathname, router, buildSearch],
  );

  return { isPending, pathname, applyFilters };
};

export const useTerritorialNavigation = (
  filters: TerritorialFilters,
  range: YearRange,
) => {
  const buildSearch = useCallback(
    (next: TerritorialFilters) => buildTerritorialSearch(next, range),
    [range],
  );
  const { isPending, applyFilters } = usePanelNavigation(buildSearch);
  const selectMunicipality = useCallback(
    (cdMun: string) => applyFilters({ ...filters, mun: cdMun }),
    [applyFilters, filters],
  );

  return { isPending, applyFilters, selectMunicipality };
};
