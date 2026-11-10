export type TabType = "paineis" | "datastories" | "boletins" | "analises";

export const TAB_KEYS: TabType[] = [
  "paineis",
  "datastories",
  "boletins",
  "analises",
];

/**
 * Picks the tab the macrotheme page opens on: the one in `?tab=` when it is
 * visible, otherwise the first visible tab.
 * Example: `resolveInitialTab(null, ["boletins", "analises"])` → `"boletins"`.
 */
export function resolveInitialTab(
  requestedTab: string | null,
  availableTabs: TabType[],
): TabType {
  const requested = TAB_KEYS.find((key) => key === requestedTab);
  if (requested && availableTabs.includes(requested)) return requested;

  // IMPORTANT: hidden tabs have no content. Defaulting to "paineis" on a
  // macrotheme without panels (Cultura, Nov 2026) opened an empty panel with
  // no tab selected.
  return availableTabs[0] ?? "paineis";
}
