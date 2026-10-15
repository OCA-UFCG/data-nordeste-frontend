import type { IPublication } from "@/utils/interfaces";

export type ExploreTab = "paineis" | "datastories" | "boletins" | "analises";

export type ExploreTabTotals = {
  dashboards: number;
  datastories: number;
  publications: number;
  analyses: number;
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
  if (typeParam === "analysis") return "analises";

  return "paineis";
}
