import { buildSearchText, normalizeSearchText } from "./search";
import type { SearchIndexItem, SearchResult } from "./types";

const DEFAULT_RELATED_PANELS_LIMIT = 8;
const RELATED_TOKEN_STOPWORDS = new Set([
  "a",
  "acessar",
  "ao",
  "aos",
  "as",
  "boletim",
  "com",
  "conteudo",
  "da",
  "das",
  "dados",
  "data",
  "datastory",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "informacao",
  "informacoes",
  "na",
  "nas",
  "no",
  "nos",
  "nordeste",
  "o",
  "os",
  "para",
  "painel",
  "por",
  "relacionado",
  "uma",
  "um",
]);

const RELATED_CONTENT_TYPES = new Set<SearchIndexItem["type"]>([
  "data-panel-detail",
  "data-story",
  "newsletter",
]);

type RelatedPanelOptions = {
  limit?: number;
};

export type RelatedPanelReference = {
  title: string;
  href?: string | null;
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
  const candidates = items.filter((item) =>
    isRelatedPanelCandidate(item, currentPanel),
  );
  const tokenWeights = buildRelatedPanelTokenWeights(candidates);

  return candidates
    .map((item) =>
      scoreRelatedPanelItem(item, currentPanel, currentTokens, tokenWeights),
    )
    .filter((item): item is SearchResult => Boolean(item))
    .sort(compareRelatedPanelItems)
    .slice(0, limit);
};

const buildRelatedPanelText = (panel: RelatedPanelReference): string =>
  buildSearchText([
    panel.title,
    panel.descriptionTitle,
    panel.descriptionText,
  ]);

const isRelatedPanelCandidate = (
  item: SearchIndexItem,
  currentPanel: RelatedPanelReference,
): boolean => {
  if (!RELATED_CONTENT_TYPES.has(item.type)) return false;
  if (currentPanel.href && item.href === currentPanel.href) return false;

  return (
    normalizeSearchText(item.title) !== normalizeSearchText(currentPanel.title)
  );
};

const scoreRelatedPanelItem = (
  item: SearchIndexItem,
  currentPanel: RelatedPanelReference,
  currentTokens: Set<string>,
  tokenWeights: Map<string, number>,
): SearchResult | null => {
  const textScore = getRelatedPanelTextScore(item, currentTokens, tokenWeights);
  if (textScore === 0) return null;

  const themeScore = getRelatedPanelThemeScore(item, currentPanel);
  const score = themeScore + textScore;

  return { ...item, score };
};

const getRelatedPanelThemeScore = (
  item: SearchIndexItem,
  currentPanel: RelatedPanelReference,
): number => {
  const currentTheme = normalizeSearchText(currentPanel.macroTheme);

  if (!currentTheme) return 0;
  if (item.themes.length === 0) return 0;
  if (hasMatchingTheme(item, currentTheme)) return 0;

  return 16;
};

const hasMatchingTheme = (
  item: SearchIndexItem,
  currentTheme: string,
): boolean =>
  item.themes.some((theme) => normalizeSearchText(theme) === currentTheme);

const getRelatedPanelTextScore = (
  item: SearchIndexItem,
  currentTokens: Set<string>,
  tokenWeights: Map<string, number>,
): number => {
  const itemTokens = getRelatedPanelTokens(item.text);
  const sharedTokens = [...currentTokens].filter((token) =>
    itemTokens.has(token),
  );

  return sharedTokens.reduce(
    (score, token) => score + (tokenWeights.get(token) || 0),
    0,
  );
};

const buildRelatedPanelTokenWeights = (
  items: SearchIndexItem[],
): Map<string, number> => {
  const tokenCounts = countRelatedPanelTokens(items);

  return new Map(
    [...tokenCounts.entries()].map(([token, count]) => [
      token,
      Math.round(12 + (items.length / count) * 8),
    ]),
  );
};

const countRelatedPanelTokens = (
  items: SearchIndexItem[],
): Map<string, number> => {
  const tokenCounts = new Map<string, number>();

  items.forEach((item) => {
    getRelatedPanelTokens(item.text).forEach((token) => {
      tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
    });
  });

  return tokenCounts;
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
