"use client";

import { useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { runExploreTransition } from "./viewTransition";

type ExploreQueryUpdates = { [key: string]: string | null };

/** Updates explore query state without requesting a new Server Component. Example: `replaceQuery({ q: "seca" })`. */
export function useExploreNavigation() {
  const pathname = usePathname();
  const params = useSearchParams();
  const paramsKey = params.toString();

  const createHref = useCallback(
    (updates: ExploreQueryUpdates): string => {
      const nextParams = new URLSearchParams(paramsKey);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) nextParams.delete(key);
        else nextParams.set(key, value);
      });

      return nextParams.size ? `${pathname}?${nextParams}` : pathname;
    },
    [paramsKey, pathname],
  );

  const replaceQuery = useCallback(
    (updates: ExploreQueryUpdates) => {
      runExploreTransition(() => {
        window.history.replaceState(null, "", createHref(updates));
      });
    },
    [createHref],
  );
  const pushQuery = useCallback(
    (updates: ExploreQueryUpdates) => {
      runExploreTransition(() => {
        window.history.pushState(null, "", createHref(updates));
      });
    },
    [createHref],
  );

  return { pushQuery, replaceQuery };
}
