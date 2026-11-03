import {
  RECENT_NEWSLETTER_POST_TYPES,
  RECENT_PANEL_POST_TYPES,
  RECENT_SECTION_POST_TYPES,
  RECENT_STORY_POST_TYPES,
  type PostType,
} from "@/features/posts/postTypes";

export type RecentFilterKey =
  | "all"
  | "panels"
  | "stories"
  | "newsletters"
  | "publications";

// IMPORTANT: kept apart from recentPosts.ts so the client tab filter can read
// these lists without pulling the Contentful client into the browser bundle.
export const RECENT_TAB_POST_TYPES: { [key in RecentFilterKey]: PostType[] } = {
  all: RECENT_SECTION_POST_TYPES,
  panels: RECENT_PANEL_POST_TYPES,
  stories: RECENT_STORY_POST_TYPES,
  newsletters: RECENT_NEWSLETTER_POST_TYPES,
  publications: [...RECENT_STORY_POST_TYPES, ...RECENT_NEWSLETTER_POST_TYPES],
};
