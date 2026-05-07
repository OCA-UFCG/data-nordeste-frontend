import { EntrySys, OrderFilterPaths } from "contentful";
import { ISudeneChannel } from "./interfaces";
import { CONTENT_REVALIDATE_SECONDS } from "@/config/revalidation";
import {
  MACROTHEME_ICON_BY_ID,
  MACROTHEME_ROUTE_BY_NAME,
  THEMES_NAVIGATION_ORDER,
} from "@/features/macrothemes/constants";
import { POST_TYPE_LABELS } from "@/features/posts/postTypes";
import type { FilterFormValue } from "@/features/filters/form";

export const REVALIDATE = CONTENT_REVALIDATE_SECONDS;

export const STORAGE_KEY = "datane@feedback_submitted";

export const channels: ISudeneChannel[] = [
  {
    name: "@sudenebr",
    href: "https://www.youtube.com/sudenebr",
    icon: "youtube",
    size: 32,
  },

  {
    name: "@sudenebr",
    href: "https://www.facebook.com/sudenebr",
    icon: "facebook",
    size: 32,
  },

  {
    name: "@sudenebr",
    href: "https://www.instagram.com/sudenebr",
    icon: "instagram",
    size: 32,
  },

  {
    name: "@sudenebr",
    href: "https://br.linkedin.com/company/superintend-ncia-do-desenvolvimento-do-nordeste",
    icon: "linkedin",
    size: 32,
  },
];

export const POSTS_PER_PAGE = 12;
export const RECORDS_PER_PAGE = 6;
export const PAGINATION_SIZE = 3;

export const ZENODO_BASE_URL = "https://zenodo.org/api/records";

export const sortingTypes: {
  [x: string]:
    | OrderFilterPaths<EntrySys, "sys">
    | "sys.contentType.sys.id"
    | "-sys.contentType.sys.id";
} = {
  "Ordem Alfabética": "title_ASC" as "sys.contentType.sys.id",
  "Mais recente": "date_DESC" as "sys.contentType.sys.id",
};

export const dataSortingTypes = {
  "Mais recente": "mostrecent",
  "Mais visualizados": "mostviewed",
};

export const POST_TYPES = POST_TYPE_LABELS;

export const macroThemes = MACROTHEME_ICON_BY_ID;

export { THEMES_NAVIGATION_ORDER };

export const themes = MACROTHEME_ROUTE_BY_NAME;

type ExploreFilterFormatter = {
  name: string;
  formatForm: (params: FilterFormValue) => {
    [key: string]: ContentfulFilterValue;
  };
  formatParam: (params: FilterFormValue) => { [key: string]: string | null };
};

type ContentfulCategoryFilter = {
  sys: {
    id_in: string[];
  };
};

type ContentfulFilterValue =
  | string
  | string[]
  | ContentfulCategoryFilter
  | undefined;

const selectedValues = (params: FilterFormValue): string[] =>
  Array.isArray(params) ? params : [];

const selectedDate = (params: FilterFormValue): Date | null =>
  params instanceof Date ? params : null;

export const exploreFilterMap: { [key: string]: ExploreFilterFormatter } = {
  category: {
    name: "{category: {sys: id_in:",
    formatForm: (params: FilterFormValue) => {
      const values = selectedValues(params);

      return values.length
        ? {
            category: {
              sys: {
                id_in: values,
              },
            },
          }
        : { category: undefined };
    },
    formatParam: (params: FilterFormValue) => {
      const values = selectedValues(params);

      return {
        category:
          values.length > 0 && !values.includes("all")
            ? values.join(",")
            : null,
      };
    },
  },
  date_gte: {
    name: "fields.date[gte]",
    formatForm: (params: FilterFormValue) => {
      const date = selectedDate(params);

      return { date_gte: date ? date.toISOString() : undefined };
    },
    formatParam: (params: FilterFormValue) => {
      const date = selectedDate(params);

      return { date_gte: date ? date.toISOString() : null };
    },
  },

  date_lte: {
    name: "fields.date[lte]",
    formatForm: (params: FilterFormValue) => {
      const date = selectedDate(params);

      return { date_lte: date ? date.toISOString() : undefined };
    },
    formatParam: (params: FilterFormValue) => {
      const date = selectedDate(params);

      return { date_lte: date ? date.toISOString() : null };
    },
  },

  type_in: {
    name: "fields.type[in]",
    formatForm: (params: FilterFormValue) => ({
      type_in: selectedValues(params),
    }),
    formatParam: (params: FilterFormValue) => {
      const values = selectedValues(params);

      return {
        type_in:
          values.length > 0 && !values.includes("all")
            ? values.join(",")
            : null,
      };
    },
  },
};
