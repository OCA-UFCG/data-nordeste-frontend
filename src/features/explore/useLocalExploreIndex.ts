"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getCachedSearchIndexItems,
  loadSearchIndexItems,
  resetSearchIndexCache,
} from "@/features/search/clientIndex";
import type { SearchIndexItem } from "@/features/search/types";
import type { ExploreResults } from "./contract";
import { selectLocalExploreResults } from "./localResults";

function requireExploreMetadata(items: SearchIndexItem[]): SearchIndexItem[] {
  const invalidPost = items.find(
    (item) => item.source === "post" && !item.explorePost,
  );
  if (!invalidPost) return items;

  resetSearchIndexCache();
  throw new Error(
    `Search item ${invalidPost.id} has no explorePost; expected search index version 2.`,
  );
}

function useExploreIndexItems(): {
  error: boolean;
  items: SearchIndexItem[] | null;
  retry: () => void;
} {
  const [items, setItems] = useState(getCachedSearchIndexItems);
  const [error, setError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (items) return;
    let active = true;
    setError(false);
    void loadSearchIndexItems()
      .then(
        (loadedItems) =>
          active && setItems(requireExploreMetadata(loadedItems)),
      )
      .catch(() => active && setError(true));

    return () => {
      active = false;
    };
  }, [items, retryToken]);

  return {
    error,
    items,
    retry: useCallback(() => setRetryToken((value) => value + 1), []),
  };
}

/** Loads the shared index once and derives explore results locally. Example: `useLocalExploreIndex(initial, params)`. */
export function useLocalExploreIndex(
  initialResults: ExploreResults,
  paramsKey: string,
) {
  const indexState = useExploreIndexItems();

  const selection = useMemo(() => {
    if (!indexState.items) return null;

    return selectLocalExploreResults(
      indexState.items,
      new URLSearchParams(paramsKey),
    );
  }, [indexState.items, paramsKey]);

  return {
    activeTab: selection?.activeTab,
    currentPage: selection?.currentPage,
    error: indexState.error,
    results: selection?.results ?? initialResults,
    retry: indexState.retry,
  };
}
