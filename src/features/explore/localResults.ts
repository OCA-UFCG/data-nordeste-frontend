import { POSTS_PER_PAGE, sortingTypes } from "@/utils/constants";
import type { IPublication } from "@/utils/interfaces";
import { normalizeSearchText } from "@/features/search/search";
import type { SearchIndexItem } from "@/features/search/types";
import { plainTextToRichText } from "@/utils/richText";
import type { PostType } from "@/features/posts/postTypes";
import {
  resolveExploreTab,
  type ExploreResults,
  type ExploreTab,
  type ExploreTabTotals,
} from "./contract";

const TYPES_BY_TAB: Record<ExploreTab, SearchIndexItem["type"][]> = {
  paineis: ["data-panel"],
  datastories: ["data-story"],
  boletins: ["newsletter", "additional-content"],
};

export type LocalExploreSelection = {
  activeTab: ExploreTab;
  currentPage: number;
  results: ExploreResults;
};

function isExplorePost(item: SearchIndexItem): boolean {
  return item.source === "post" && item.explorePost !== null;
}

function isPostType(type: SearchIndexItem["type"]): type is PostType {
  return [
    "additional-content",
    "data-panel",
    "newsletter",
    "data-story",
  ].includes(type);
}

function matchesQuery(item: SearchIndexItem, query: string): boolean {
  const tokens = normalizeSearchText(query).split(" ").filter(Boolean);

  return tokens.every((token) => item.text.includes(token));
}

function matchesThemes(item: SearchIndexItem, themeIds: string[]): boolean {
  if (themeIds.length === 0) return true;

  return themeIds.some((themeId) =>
    item.explorePost?.themeIds.includes(themeId),
  );
}

function sortExploreItems(
  items: SearchIndexItem[],
  sorting: string | null,
): SearchIndexItem[] {
  return [...items].sort((left, right) => {
    if (sorting === sortingTypes["Ordem alfabética"]) {
      return left.title.localeCompare(right.title, "pt-BR");
    }

    const leftDate = left.date ? Date.parse(left.date) : 0;
    const rightDate = right.date ? Date.parse(right.date) : 0;

    return rightDate - leftDate;
  });
}

function toPublication(item: SearchIndexItem): IPublication {
  if (!item.explorePost || !isPostType(item.type)) {
    throw new Error(
      `Search item ${item.id} has type ${item.type} and explorePost ${Boolean(item.explorePost)}; expected an explore post type with metadata.`,
    );
  }

  return {
    sys: { id: item.explorePost.contentfulId },
    title: item.title,
    link: item.explorePost.link,
    thumb: { url: item.thumb || "" },
    type: item.type,
    date: item.date || "",
    description: plainTextToRichText(item.description),
  };
}

function totalForTab(items: SearchIndexItem[], tab: ExploreTab): number {
  return items.filter((item) => TYPES_BY_TAB[tab].includes(item.type)).length;
}

function firstAvailableTab(items: SearchIndexItem[]): ExploreTab | null {
  const tabs: ExploreTab[] = ["paineis", "datastories", "boletins"];

  return tabs.find((tab) => totalForTab(items, tab) > 0) ?? null;
}

function filterSharedItems(
  items: SearchIndexItem[],
  params: URLSearchParams,
): SearchIndexItem[] {
  const query = params.get("q") || "";
  const themeIds = params.get("category")?.split(",").filter(Boolean) ?? [];
  const matchingHrefs = new Set(
    items.filter((item) => matchesQuery(item, query)).map((item) => item.href),
  );

  return items
    .filter(isExplorePost)
    .filter((item) => matchingHrefs.has(item.href))
    .filter((item) => matchesThemes(item, themeIds));
}

function resolveAvailableTab(
  items: SearchIndexItem[],
  requestedTab: ExploreTab,
): ExploreTab {
  if (totalForTab(items, requestedTab) > 0) return requestedTab;

  return firstAvailableTab(items) ?? requestedTab;
}

function resolveCurrentPage(
  requestedPage: string | null,
  totalPages: number,
): number {
  const numericPage = Number(requestedPage);
  const validPage =
    Number.isInteger(numericPage) && numericPage > 0 ? numericPage : 1;

  return Math.min(validPage, Math.max(totalPages, 1));
}

function buildTabTotals(items: SearchIndexItem[]): ExploreTabTotals {
  return {
    dashboards: totalForTab(items, "paineis"),
    datastories: totalForTab(items, "datastories"),
    publications: totalForTab(items, "boletins"),
  };
}

/** Derives the complete explore view from the cached index and URL. Example: `selectLocalExploreResults(items, params)`. */
export function selectLocalExploreResults(
  items: SearchIndexItem[],
  params: URLSearchParams,
): LocalExploreSelection {
  const sharedItems = filterSharedItems(items, params);
  const requestedTab = resolveExploreTab(params.get("type_in"));
  const activeTab = resolveAvailableTab(sharedItems, requestedTab);
  const activeItems = sortExploreItems(
    sharedItems.filter((item) => TYPES_BY_TAB[activeTab].includes(item.type)),
    params.get("sort"),
  );
  const totalPages = Math.ceil(activeItems.length / POSTS_PER_PAGE);
  const currentPage = resolveCurrentPage(params.get("page"), totalPages);
  const offset = (currentPage - 1) * POSTS_PER_PAGE;

  return {
    activeTab,
    currentPage,
    results: {
      items: activeItems
        .slice(offset, offset + POSTS_PER_PAGE)
        .map(toPublication),
      total: activeItems.length,
      totalPages,
      tabTotals: buildTabTotals(sharedItems),
    },
  };
}
