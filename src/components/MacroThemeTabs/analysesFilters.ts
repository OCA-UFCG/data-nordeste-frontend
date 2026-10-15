import type { IPublication } from "@/utils/interfaces";

export const ALL_OPTION = "all";

export type AnalysesSort = "date_DESC" | "date_ASC" | "title_ASC";

export const ANALYSES_SORT_OPTIONS: { value: AnalysesSort; label: string }[] = [
  { value: "date_DESC", label: "Mais recentes" },
  { value: "date_ASC", label: "Mais antigas" },
  { value: "title_ASC", label: "Ordem alfabética" },
];

export type AnalysesFilterState = {
  panelId: string;
  year: string;
  sort: AnalysesSort;
};

const yearOf = (post: IPublication) => post.date?.slice(0, 4) ?? "";

/** Lists the years that have at least one analysis, newest first. Example: `listAnalysesYears(posts)` → `["2026", "2025"]`. */
export function listAnalysesYears(posts: IPublication[]): string[] {
  return Array.from(new Set(posts.map(yearOf).filter(Boolean))).sort(
    (left, right) => right.localeCompare(left),
  );
}

/** Applies the panel, year and sort selection of the Análises tab. Example: `filterAnalyses(posts, { panelId: "all", year: "2026", sort: "date_DESC" })`. */
export function filterAnalyses(
  posts: IPublication[],
  { panelId, year, sort }: AnalysesFilterState,
): IPublication[] {
  const filtered = posts.filter(
    (post) =>
      (panelId === ALL_OPTION || post.panel?.sys.id === panelId) &&
      (year === ALL_OPTION || yearOf(post) === year),
  );

  return filtered.sort((left, right) => {
    if (sort === "title_ASC") {
      return left.title.localeCompare(right.title, "pt-BR");
    }
    const diff = Date.parse(left.date || "0") - Date.parse(right.date || "0");

    return sort === "date_ASC" ? diff : -diff;
  });
}
