import { buildSearchText, normalizeSearchText } from "./search";
import type { SearchIndexItem, SearchResult } from "./types";

const DEFAULT_RELATED_PANELS_LIMIT = 8;
const RELATED_TOKEN_STOPWORDS = new Set([
  "a",
  "as",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "o",
  "os",
  "para",
  "painel",
]);

type RelatedPanelOptions = {
  limit?: number;
};

export type RelatedPanelReference = {
  title: string;
  macroTheme?: string | null;
  descriptionTitle?: string | null;
  descriptionText?: string | null;
};

export const getRelatedPanelItems = (
  items: SearchIndexItem[],
  currentPanel: RelatedPanelReference,
  { limit = DEFAULT_RELATED_PANELS_LIMIT }: RelatedPanelOptions = {},
): SearchResult[] => {
  const currentText = buildRelatedPanelText(currentPanel);
  const currentTokens = getRelatedPanelTokens(currentText);

  return items
    .filter((item) => isRelatedPanelCandidate(item, currentPanel))
    .map((item) => scoreRelatedPanelItem(item, currentPanel, currentTokens))
    .filter((item): item is SearchResult => Boolean(item))
    .sort(compareRelatedPanelItems)
    .slice(0, limit);
};

const buildRelatedPanelText = (panel: RelatedPanelReference): string =>
  buildSearchText([
    panel.title,
    panel.macroTheme,
    panel.descriptionTitle,
    panel.descriptionText,
  ]);

const isRelatedPanelCandidate = (
  item: SearchIndexItem,
  currentPanel: RelatedPanelReference,
): boolean => {
  if (item.type !== "data-panel-detail") return false;

  return (
    normalizeSearchText(item.title) !== normalizeSearchText(currentPanel.title)
  );
};

const scoreRelatedPanelItem = (
  item: SearchIndexItem,
  currentPanel: RelatedPanelReference,
  currentTokens: Set<string>,
): SearchResult | null => {
  const themeScore = getRelatedPanelThemeScore(item, currentPanel);
  const textScore = getRelatedPanelTextScore(item, currentTokens);
  const score = themeScore + textScore;

  return score > 0 ? { ...item, score } : null;
};

const getRelatedPanelThemeScore = (
  item: SearchIndexItem,
  currentPanel: RelatedPanelReference,
): number => {
  const currentTheme = normalizeSearchText(currentPanel.macroTheme);

  if (!currentTheme) return 0;
  if (
    item.themes.some((theme) => normalizeSearchText(theme) === currentTheme)
  ) {
    return 100;
  }

  return 0;
};

const getRelatedPanelTextScore = (
  item: SearchIndexItem,
  currentTokens: Set<string>,
): number => {
  const itemTokens = getRelatedPanelTokens(item.text);
  const sharedTokens = [...currentTokens].filter((token) =>
    itemTokens.has(token),
  );

  return sharedTokens.length * 8;
};

const getRelatedPanelTokens = (text: string): Set<string> =>
  new Set(
    normalizeSearchText(text)
      .split(" ")
      .filter(
        (token) => token.length > 2 && !RELATED_TOKEN_STOPWORDS.has(token),
      ),
  );

const compareRelatedPanelItems = (left: SearchResult, right: SearchResult) => {
  if (right.score !== left.score) return right.score - left.score;

  const leftDate = left.date ? new Date(left.date).getTime() : 0;
  const rightDate = right.date ? new Date(right.date).getTime() : 0;

  if (rightDate !== leftDate) return rightDate - leftDate;

  return left.title.localeCompare(right.title, "pt-BR");
};
