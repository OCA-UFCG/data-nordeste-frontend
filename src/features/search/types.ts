export type SearchItemSource = "post" | "panels" | "dataStories" | "theme";

export type SearchItemType =
  | "additional-content"
  | "data-panel"
  | "data-panel-detail"
  | "data-story"
  | "data-story-detail"
  | "newsletter"
  | "theme";

export type SearchIndexItem = {
  id: string;
  source: SearchItemSource;
  type: SearchItemType;
  title: string;
  description: string;
  href: string;
  date: string | null;
  thumb: string | null;
  themes: string[];
  tags: string[];
  text: string;
};

export type SearchIndex = {
  version: number;
  generatedAt: string;
  items: SearchIndexItem[];
};

export type SearchResult = SearchIndexItem & {
  score: number;
};
