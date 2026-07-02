export type ExploreSearchFocusOwner = "explore" | "header";

let latestExploreSearchFocus: ExploreSearchFocusOwner | null = null;

export function setExploreSearchFocusOwner(
  owner: ExploreSearchFocusOwner,
): void {
  latestExploreSearchFocus = owner;
}

export function getExploreSearchFocusOwner(): ExploreSearchFocusOwner | null {
  return latestExploreSearchFocus;
}
