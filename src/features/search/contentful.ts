import { getContent } from "@/utils/contentful";
import { SEARCH_INDEX_QUERY } from "@/utils/queries";
import type { SearchIndex, SearchIndexItem, SearchItemType } from "./types";
import { buildSearchText } from "./search";

type ContentfulAsset = {
  url?: string | null;
};

type ContentfulSys = {
  id: string;
};

type ContentfulTheme = {
  sys: ContentfulSys;
  id?: string | null;
  name?: string | null;
  color?: string | null;
  tags?: string[] | null;
  articleTitle?: string | null;
  banner?: ContentfulAsset | null;
};

type ContentfulPost = {
  sys: ContentfulSys;
  title?: string | null;
  type?: SearchItemType | null;
  date?: string | null;
  description?: string | null;
  link?: string | null;
  thumb?: ContentfulAsset | null;
  categoryCollection?: {
    items?: ContentfulTheme[];
  } | null;
};

type ContentfulPanel = {
  sys: ContentfulSys;
  title?: string | null;
  date?: string | null;
  macroTheme?: string | null;
  descriptionTitle?: string | null;
  description?: string | null;
};

type ContentfulDataStory = {
  sys: ContentfulSys;
  id?: string | null;
};

type SearchIndexContent = {
  postCollection?: { items?: ContentfulPost[] };
  panelsCollection?: { items?: ContentfulPanel[] };
  dataStoriesCollection?: { items?: ContentfulDataStory[] };
  themeCollection?: { items?: ContentfulTheme[] };
};

export const getSearchIndex = async (): Promise<SearchIndex> => {
  const data = await getContent<SearchIndexContent>(SEARCH_INDEX_QUERY);
  const items = [
    ...buildPostItems(data.postCollection?.items || []),
    ...buildPanelItems(data.panelsCollection?.items || []),
    ...buildDataStoryItems(data.dataStoriesCollection?.items || []),
    ...buildThemeItems(data.themeCollection?.items || []),
  ];

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    items,
  };
};

const buildPostItems = (posts: ContentfulPost[]): SearchIndexItem[] =>
  posts
    .filter((post) => Boolean(post.sys?.id && post.title && post.link))
    .map((post) => {
      const categories = post.categoryCollection?.items?.filter(Boolean) || [];
      const tags = unique(
        categories.flatMap((category) => category.tags || []),
      );
      const title =
        post.type === "data-panel"
          ? stripPanelTitlePrefix(post.title) || post.title || ""
          : post.title || "";
      const themes = categories
        .map((category) => category.name)
        .filter((name): name is string => Boolean(name));

      return {
        id: `post:${post.sys.id}`,
        source: "post",
        type: post.type || "additional-content",
        title,
        description: post.description || "",
        href: buildPublicContentHref(post.link || ""),
        date: post.date || null,
        thumb: post.thumb?.url || null,
        themes,
        tags,
        text: buildSearchText([title, post.description, ...themes, ...tags]),
      };
    });

const buildPanelItems = (panels: ContentfulPanel[]): SearchIndexItem[] =>
  panels
    .filter((panel) => Boolean(panel.sys?.id && panel.title))
    .map((panel) => {
      const title =
        panel.macroTheme || panel.descriptionTitle || panel.title || "";
      const description = panel.description || panel.descriptionTitle || "";
      const themes = panel.macroTheme ? [panel.macroTheme] : [];

      return {
        id: `panel:${panel.sys.id}`,
        source: "panels",
        type: "data-panel-detail",
        title,
        description,
        href: `/data-panel/${encodeURIComponent(panel.title || "")}`,
        date: panel.date || null,
        thumb: null,
        themes,
        tags: [],
        text: buildSearchText([
          panel.title,
          panel.macroTheme,
          panel.descriptionTitle,
          panel.description,
        ]),
      };
    });

const buildDataStoryItems = (
  dataStories: ContentfulDataStory[],
): SearchIndexItem[] =>
  dataStories
    .filter((story) => Boolean(story.sys?.id && story.id))
    .map((story) => ({
      id: `dataStory:${story.sys.id}`,
      source: "dataStories",
      type: "data-story-detail",
      title: "Datastory",
      description: "",
      href: `/data-stories/${story.id}`,
      date: null,
      thumb: null,
      themes: [],
      tags: [],
      text: buildSearchText([story.id]),
    }));

const buildThemeItems = (themes: ContentfulTheme[]): SearchIndexItem[] =>
  themes
    .filter((theme) => Boolean(theme.sys?.id && theme.id && theme.name))
    .map((theme) => {
      const tags = theme.tags || [];
      const title = theme.name || "";

      return {
        id: `theme:${theme.sys.id}`,
        source: "theme",
        type: "theme",
        title,
        description: theme.articleTitle || "",
        href: `/macrothemes/${(theme.id || "").replace(/_/g, "-")}`,
        date: null,
        thumb: theme.banner?.url || null,
        themes: [title],
        tags,
        text: buildSearchText([title, theme.id, theme.articleTitle, ...tags]),
      };
    });

const stripPanelTitlePrefix = (title?: string | null) =>
  (title || "").replace(/^Acessar\s+painel:\s*/i, "").trim();

const buildPublicContentHref = (link: string): string => {
  try {
    const url = new URL(link);
    const storyId = url.pathname.match(/\/stories\/([0-9a-f]{32})/i)?.[1];
    const experienceId = url.pathname.match(
      /\/experience\/([0-9a-f]{32})/i,
    )?.[1];

    if (storyId) return `/data-stories/${storyId}`;
    if (experienceId) return `/experience/${experienceId}`;
  } catch {
    return link;
  }

  return link;
};

const unique = (values: string[]) => [...new Set(values.filter(Boolean))];
