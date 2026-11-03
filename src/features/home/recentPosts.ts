import { getContent } from "@/utils/contentful";
import type { IPublication } from "@/utils/interfaces";
import { RECENT_POSTS_BY_TAB_QUERY } from "@/utils/queries";
import { RECENT_TAB_POST_TYPES, type RecentFilterKey } from "./recentTabs";

export type RecentPostsByTab = { [key in RecentFilterKey]: IPublication[] };

type RecentPostsResponse = {
  [key in RecentFilterKey]: { items: IPublication[] };
};

type RecentPostsContentfulRequest = <T>(
  query: string,
  variables?: Parameters<typeof getContent>[1],
) => Promise<T>;

const RECENT_TAB_KEYS = Object.keys(RECENT_TAB_POST_TYPES) as RecentFilterKey[];

const buildRecentPostsVariables = () =>
  Object.fromEntries(
    RECENT_TAB_KEYS.map((key) => [
      `${key}Filter`,
      { type_in: RECENT_TAB_POST_TYPES[key] },
    ]),
  );

/** Loads every home "Recentes" tab on the server in one cached Contentful call. Example: `await fetchRecentPostsByTab()`. */
export async function fetchRecentPostsByTab(
  requestContentful: RecentPostsContentfulRequest = getContent,
): Promise<RecentPostsByTab> {
  const response = await requestContentful<RecentPostsResponse>(
    RECENT_POSTS_BY_TAB_QUERY,
    buildRecentPostsVariables(),
  );

  return Object.fromEntries(
    RECENT_TAB_KEYS.map((key) => [key, response[key].items]),
  ) as RecentPostsByTab;
}
