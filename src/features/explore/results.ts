import { sortingTypes } from "@/utils/constants";
import { getContent } from "@/utils/contentful";
import type { IPublication } from "@/utils/interfaces";
import { EXPLORE_RESULTS_QUERY } from "@/utils/queries";
import {
  buildPostsContentfulFilter,
  buildPostsSkip,
  buildPostsTotalPages,
  parsePostsQueryState,
  type PostsFilterForm,
} from "@/features/posts/filters";
import {
  resolveExploreTab,
  type ExploreResults,
  type ExploreTab,
} from "./contract";

type ExploreQueryResponse = {
  activePosts: { total: number; items: IPublication[] };
  dashboards: { total: number };
  datastories: { total: number };
  publications: { total: number };
};

type ExploreContentfulRequest = <T>(
  query: string,
  variables?: Parameters<typeof getContent>[1],
) => Promise<T>;

type ExploreQueryVariables = NonNullable<Parameters<typeof getContent>[1]>;

const TYPE_BY_TAB: Record<ExploreTab, string | string[]> = {
  paineis: "data-panel",
  datastories: "data-story",
  boletins: ["newsletter", "additional-content"],
};

function normalizeExploreParams(params: URLSearchParams): URLSearchParams {
  const normalized = new URLSearchParams(params);
  const requestedPage = Number(normalized.get("page"));
  const validSorts = Object.values(sortingTypes) as string[];

  if (!Number.isInteger(requestedPage) || requestedPage < 1) {
    normalized.set("page", "1");
  }
  if (!validSorts.includes(normalized.get("sort") ?? "")) {
    normalized.delete("sort");
  }

  return normalized;
}

function withoutTypeFilter(filter: PostsFilterForm): PostsFilterForm {
  const sharedFilter = { ...filter };
  delete sharedFilter.type_in;

  return sharedFilter;
}

function buildExploreQueryVariables(
  params: URLSearchParams,
): ExploreQueryVariables {
  const state = parsePostsQueryState(params, Number.MAX_SAFE_INTEGER);
  const activeTab = resolveExploreTab(params.get("type_in"));
  const sharedFilter = withoutTypeFilter(state.filter);
  const tabFilter = (tab: ExploreTab) =>
    buildPostsContentfulFilter(sharedFilter, { type_in: TYPE_BY_TAB[tab] });

  return {
    order: state.sorting,
    skip: buildPostsSkip(state.currentPage),
    activeFilter: tabFilter(activeTab),
    dashboardsFilter: tabFilter("paineis"),
    datastoriesFilter: tabFilter("datastories"),
    publicationsFilter: tabFilter("boletins"),
  };
}

function mapExploreResponse(response: ExploreQueryResponse): ExploreResults {
  return {
    items: response.activePosts.items,
    total: response.activePosts.total,
    totalPages: buildPostsTotalPages(response.activePosts.total),
    tabTotals: {
      dashboards: response.dashboards.total,
      datastories: response.datastories.total,
      publications: response.publications.total,
    },
  };
}

/** Fetches one atomic result for cards and tab totals. Example: `fetchExploreResults(new URLSearchParams())`. */
export async function fetchExploreResults(
  rawParams: URLSearchParams,
  requestContentful: ExploreContentfulRequest = getContent,
): Promise<ExploreResults> {
  const params = normalizeExploreParams(rawParams);
  const response = await requestContentful<ExploreQueryResponse>(
    EXPLORE_RESULTS_QUERY,
    buildExploreQueryVariables(params),
  );

  return mapExploreResponse(response);
}
