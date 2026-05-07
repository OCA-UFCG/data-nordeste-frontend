import type { Document } from "@contentful/rich-text-types";
import type { PostType } from "@/features/posts/postTypes";

export type ContentfulRichText = Document;

export type ContentfulRichTextField = {
  json: ContentfulRichText;
};

export interface ISudeneChannel {
  name: string;
  href: string;
  icon: string;
  size?: number;
}

export interface SectionHeader {
  id: string;
  title: string;
  subtitle: string;
  thumb?: {
    url: string;
  };
}

export interface ISection {
  name: string;
  id: string;
  path: string;
  appears: boolean;
  childrenCollection?: { items: ISection[] };
}

export interface ISections {
  [key: string]: ISection;
}

export interface Project {
  name: string;
  description: string;
  link: string;
  details: ContentfulRichTextField;
  thumb: {
    url: string;
  };
}

export interface IAbout {
  id: string;
  albumCollection: {
    items: {
      url: string;
      width: string;
      height: string;
      description: string;
    }[];
  };
  details: ContentfulRichTextField;
  thumb: {
    url: string;
  };
}

export interface ISectionHeader {
  fields: {
    id: string;
    title: string;
    subtitle?: string;
  };
}

export interface IPublication {
  title: string;
  link: string;
  thumb: {
    url: string;
  };
  type: PostType;
  date: string;
  description: string;
}

export interface ReportData {
  date: string;
  title: string;
  source: string;
  macroTheme: string;
  description: string;
}

export interface MacroTheme {
  name: string;
  id: string;
  color: string;
  sys: {
    id: string;
  };
  description: ContentfulRichTextField;
  article: ContentfulRichTextField;
  articleTitle: string;
  banner: { url: string };
  tags: string[];
}

export interface IPreviewCard {
  title: string;
  subtitle?: string;
  category: MacroTheme;
  link: string;
  data: string;
  note?: string;
  iconsvg?: { url: string };
}

export interface IPreviewCards {
  title: string;
  jsonFile: IRegionData;
  category: MacroTheme;
  mostrarNaHomepage?: boolean;
}

export interface IRegionData {
  region: string;
  title: string;
  subtitle?: string;
  data: string;
  link: string;
  note?: string;
  states: IStateData[];
}

export interface IStateData {
  name: string;
  data: string;
  link: string;
  note?: string;
}

export interface IMainBanner {
  buttonLabel: string;
  buttonUrl: string;
  title: string;
  subtitle: string;
  image: {
    url: string;
  };
}

export interface IPageHeader {
  title: string;
  subtitle?: string;
  richSubtitle?: ContentfulRichTextField;
}

export interface ITab {
  name: string;
  id: string;
  path: string;
}

export interface IContact {
  name: string;
  type: string;
  path: string;
}

export interface IPartners {
  id: string;
  details: ContentfulRichTextField;
  albumCollection: {
    items: {
      url: string;
      width: string;
      height: string;
      description: string;
    }[];
  };
}
export interface IValues {
  title: string;
  thumb: {
    url: string;
  };
  details: ContentfulRichTextField;
  id: string;
}

export interface IDataStory {
  name: string;
  id: string;
}

export interface IFeedbackQuestion {
  id: string;
  question: ContentfulRichTextField;
  type: string;
  shape: string;
}

export interface IFeedbackAnswer {
  id: string;
  text: string;
  answer: string | number;
}

export type Tag = string | { name: string; slug?: string };

export interface IMetadata {
  id: string;
  title: string;
  description: string;
  publication_date: string;
  version: string;
  tags?: Tag[];
  html: string;
  license: string;
  files: {
    name: string;
    downloadUrl: string;
  }[];
}

export interface FilterGroup {
  title: string;
  type: string;
  options: {
    slug: string;
    title: string;
  }[];
}

export interface Filters {
  [key: string]: string[] | Date | string | undefined;
  category?: string[];
  license?: string[];
  download?: string[];
  date_gte?: Date;
  date_lte?: Date;
  sort?: string;
}
