import type { SearchIndexItem, SearchItemType, SearchResult } from "./types";

export const MIN_SEARCH_QUERY_LENGTH = 2;
export const DEFAULT_SEARCH_LIMIT = 8;

type SearchItemsOptions = {
  limit?: number;
  themeNames?: string[];
  types?: SearchItemType[];
};

export const normalizeSearchText = (value?: string | null): string =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

export const buildSearchText = (parts: Array<string | null | undefined>) =>
  normalizeSearchText(parts.filter(Boolean).join(" "));

export const searchItems = (
  items: SearchIndexItem[],
  query: string,
  {
    limit = DEFAULT_SEARCH_LIMIT,
    themeNames = [],
    types = [],
  }: SearchItemsOptions = {},
): SearchResult[] => {
  const normalizedQuery = normalizeSearchText(query);

  if (normalizedQuery.length < MIN_SEARCH_QUERY_LENGTH) return [];

  const tokens = normalizedQuery.split(" ").filter(Boolean);
  const scopedItems = scopeSearchItems(items, themeNames, types);
  const scored = scopedItems
    .map((item) => scoreSearchItem(item, normalizedQuery, tokens))
    .filter((item): item is SearchResult => Boolean(item));

  return dedupeSearchResults(scored).sort(compareSearchResults).slice(0, limit);
};

export const getSearchTypeLabel = (item: Pick<SearchIndexItem, "type">) => {
  switch (item.type) {
    case "data-panel":
    case "data-panel-detail":
      return "Painel de dados";
    case "data-story":
    case "data-story-detail":
      return "Datastory";
    case "newsletter":
      return "Boletim";
    case "additional-content":
      return "Notícia";
    case "theme":
      return "Macrotema";
    default:
      return "Conteúdo";
  }
};

export const getSearchGroupKey = (item: Pick<SearchIndexItem, "type">) => {
  if (item.type === "theme") return "themes";
  if (item.type === "data-panel" || item.type === "data-panel-detail") {
    return "panels";
  }

  return "content";
};

const scoreSearchItem = (
  item: SearchIndexItem,
  normalizedQuery: string,
  tokens: string[],
): SearchResult | null => {
  const text = item.text || buildSearchText(searchItemTextParts(item));

  if (!tokens.every((token) => text.includes(token))) return null;

  const title = normalizeSearchText(item.title);
  const description = normalizeSearchText(item.description);
  const themes = normalizeSearchText(item.themes.join(" "));
  const tags = normalizeSearchText(item.tags.join(" "));

  let score = 1;

  if (title === normalizedQuery) score += 180;
  else if (title.startsWith(normalizedQuery)) score += 130;
  else if (title.includes(normalizedQuery)) score += 100;

  if (themes.includes(normalizedQuery)) score += 70;
  if (tags.includes(normalizedQuery)) score += 60;
  if (description.includes(normalizedQuery)) score += 35;
  if (item.type === "theme") score += 10;

  tokens.forEach((token) => {
    if (title.startsWith(token)) score += 35;
    else if (title.includes(token)) score += 25;
    if (themes.includes(token)) score += 12;
    if (tags.includes(token)) score += 10;
    if (description.includes(token)) score += 6;
  });

  return { ...item, score };
};

const searchItemTextParts = (item: SearchIndexItem) => [
  item.title,
  item.description,
  ...item.themes,
  ...item.tags,
];

const scopeSearchItems = (
  items: SearchIndexItem[],
  themeNames: string[],
  types: SearchItemType[],
): SearchIndexItem[] => {
  const normalizedThemes = themeNames.map(normalizeSearchText).filter(Boolean);
  const allowedTypes = new Set(types);

  return items.filter(
    (item) =>
      itemMatchesTypes(item, allowedTypes) &&
      itemMatchesThemes(item, normalizedThemes),
  );
};

const itemMatchesTypes = (
  item: SearchIndexItem,
  allowedTypes: Set<SearchItemType>,
): boolean => !allowedTypes.size || allowedTypes.has(item.type);

const itemMatchesThemes = (
  item: SearchIndexItem,
  themeNames: string[],
): boolean => {
  if (!themeNames.length) return true;

  const itemThemes = item.themes.map(normalizeSearchText);

  return itemThemes.some((theme) => themeNames.includes(theme));
};

const dedupeSearchResults = (results: SearchResult[]) => {
  const byHref = new Map<string, SearchResult>();

  results.forEach((result) => {
    const current = byHref.get(result.href);

    if (!current || compareSearchResults(result, current) < 0) {
      byHref.set(result.href, result);
    }
  });

  return [...byHref.values()];
};

const compareSearchResults = (left: SearchResult, right: SearchResult) => {
  if (right.score !== left.score) return right.score - left.score;

  const leftDate = left.date ? new Date(left.date).getTime() : 0;
  const rightDate = right.date ? new Date(right.date).getTime() : 0;

  if (rightDate !== leftDate) return rightDate - leftDate;

  return left.title.localeCompare(right.title, "pt-BR");
};
