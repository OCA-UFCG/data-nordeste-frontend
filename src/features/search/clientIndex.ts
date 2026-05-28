import type { SearchIndex, SearchIndexItem } from "./types";

const SEARCH_INDEX_URL = "/search-index.json";

let cachedItems: SearchIndexItem[] | null = null;
let cachedRequest: Promise<SearchIndexItem[]> | null = null;

export const getCachedSearchIndexItems = () => cachedItems;

export const loadSearchIndexItems = async (): Promise<SearchIndexItem[]> => {
  if (cachedItems) return cachedItems;
  if (!cachedRequest) {
    cachedRequest = fetch(SEARCH_INDEX_URL)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Search index request failed: ${response.status}`);
        }

        const index = (await response.json()) as SearchIndex;
        const items = index.items || [];

        cachedItems = items;

        return items;
      })
      .finally(() => {
        cachedRequest = null;
      });
  }

  return cachedRequest;
};

export const resetSearchIndexCache = () => {
  cachedItems = null;
  cachedRequest = null;
};
