"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import {
  buildTerritorialSearch,
  type TerritorialFilters,
  type YearRange,
} from "@/features/panels/territorialFilters";

export const useTerritorialNavigation = (
  filters: TerritorialFilters,
  range: YearRange,
) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const applyFilters = useCallback(
    (next: TerritorialFilters) =>
      startTransition(() =>
        router.replace(`${pathname}${buildTerritorialSearch(next, range)}`, {
          scroll: false,
        }),
      ),
    [pathname, router, range],
  );
  const selectMunicipality = useCallback(
    (cdMun: string) => applyFilters({ ...filters, mun: cdMun }),
    [applyFilters, filters],
  );

  return { isPending, applyFilters, selectMunicipality };
};
