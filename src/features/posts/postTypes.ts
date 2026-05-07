export const POST_TYPE_VALUES = [
  "additional-content",
  "data-panel",
  "newsletter",
  "data-story",
] as const;

export type PostType = (typeof POST_TYPE_VALUES)[number];

export const POST_TYPE_LABELS: { [key in PostType]: string } = {
  "additional-content": "Notícia",
  "data-panel": "Painel de dados",
  "newsletter": "Boletim",
  "data-story": "Datastory",
};

export const POSTS_ROUTE_POST_TYPES: PostType[] = [
  "newsletter",
  "additional-content",
  "data-story",
];

export const EXPLORE_ROUTE_POST_TYPES: PostType[] = [
  "data-panel",
  "newsletter",
  "additional-content",
  "data-story",
];

export const RECENT_SECTION_POST_TYPES: PostType[] = [
  "data-panel",
  "newsletter",
  "additional-content",
];

export const RECENT_PANEL_POST_TYPES: PostType[] = ["data-panel"];

export const RECENT_PUBLICATION_POST_TYPES: PostType[] = [
  "newsletter",
  "additional-content",
];

export const buildPostTypeFields = (types: PostType[]) =>
  Object.fromEntries(types.map((type) => [type, POST_TYPE_LABELS[type]]));

export const isPublicationPostType = (type: PostType) =>
  type === "newsletter" || type === "additional-content";
