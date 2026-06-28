import type { IPublication } from "@/utils/interfaces";

export type ExploreTab = "paineis" | "datastories" | "boletins";

export type ExploreTabTotals = {
  dashboards: number;
  datastories: number;
  publications: number;
};

export type ExploreResults = {
  items: IPublication[];
  total: number;
  totalPages: number;
  tabTotals: ExploreTabTotals;
};

/** Resolves the public type query to an explore tab. Example: `resolveExploreTab("data-story")`. */
export function resolveExploreTab(typeParam: string | null): ExploreTab {
  if (typeParam === "data-story") return "datastories";
  if (typeParam === "newsletter,additional-content") return "boletins";

  return "paineis";
}
