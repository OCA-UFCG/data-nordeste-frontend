import { normalizeKey } from "@/utils/functions";
import { IMetadata, MacroTheme, Tag } from "@/utils/interfaces";

export type CatalogTagView = {
  key: string;
  label: string;
  color: string;
};

const DEFAULT_TAG_COLOR = "#018F39";

export const buildCatalogThemeLookup = (themes: MacroTheme[]) => {
  const themeLookup: { [key: string]: MacroTheme } = {};

  themes.forEach((theme) => {
    buildThemeCandidateKeys(theme).forEach((key) => {
      if (!themeLookup[key]) themeLookup[key] = theme;
    });
  });

  return themeLookup;
};

export const buildCatalogTagViews = (
  postTags: Tag[] | undefined,
  themes: MacroTheme[],
): CatalogTagView[] => {
  const themeLookup = buildCatalogThemeLookup(themes);

  return (postTags ?? []).map((tag, index) =>
    buildCatalogTagView(tag, index, themeLookup),
  );
};

export const formatCatalogPublicationDate = (value: string): string => {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
};

export const applyCatalogFilterLabels = (
  records: IMetadata[],
  slugTitleMap: { [slug: string]: string },
): IMetadata[] =>
  records.map((record) => ({
    ...record,
    tags: formatCatalogRecordTags(record.tags, slugTitleMap),
  }));

const buildThemeCandidateKeys = (theme: MacroTheme): string[] => {
  const candidates = new Set<string>();
  const baseKeys = [theme.id, theme.sys?.id, theme.name].map(normalizeKey);

  baseKeys.forEach((key) => {
    if (key) candidates.add(key);
  });

  const nameKey = normalizeKey(theme.name);
  if (nameKey) {
    candidates.add(nameKey.replace(/_/g, "-"));
    candidates.add(nameKey.replace(/-/g, "_"));
  }

  return [...candidates];
};

const buildCatalogTagView = (
  tag: Tag,
  index: number,
  themeLookup: { [key: string]: MacroTheme },
): CatalogTagView => {
  const tagName = typeof tag === "string" ? tag : tag.name ?? "";
  const tagSlug = typeof tag === "string" ? tag : tag.slug ?? tagName;
  const normalized = normalizeKey(tagSlug || tagName);
  const themeMatch = findCatalogTagTheme(normalized, tagName, themeLookup);

  return {
    key: `${normalized || `tag-${index}`}-${index}`,
    label: themeMatch?.name ?? tagName,
    color: themeMatch?.color ?? DEFAULT_TAG_COLOR,
  };
};

const findCatalogTagTheme = (
  normalizedSlug: string,
  tagName: string,
  themeLookup: { [key: string]: MacroTheme },
): MacroTheme | undefined =>
  themeLookup[normalizedSlug] ||
  themeLookup[normalizedSlug.replace(/-/g, "_")] ||
  themeLookup[normalizedSlug.replace(/_/g, "-")] ||
  themeLookup[normalizeKey(tagName)];

const formatCatalogRecordTags = (
  tags: Tag[] | undefined,
  slugTitleMap: { [slug: string]: string },
): Tag[] =>
  (tags ?? []).map((tag) => {
    if (typeof tag === "string") {
      return { slug: tag, name: slugTitleMap[tag] || tag };
    }

    const key = tag.slug ?? tag.name ?? "";

    return { slug: key, name: slugTitleMap[key] || tag.name || key };
  });
