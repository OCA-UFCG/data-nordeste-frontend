import { exploreFilterMap } from "@/utils/constants";
import { sortingTypes } from "@/utils/constants";
import { POSTS_PER_PAGE } from "@/utils/constants";
import { createQueryString } from "@/utils/functions";

export type PostsFilterForm = {
  [key: string]: string | string[] | Date | undefined;
};

type ContentfulCategoryFilter = {
  sys: {
    id_in: string[];
  };
};

type PostsContentfulFilterValue = string | string[] | ContentfulCategoryFilter;

export type ParsedPostsFilters = {
  contentfulFilter: { [key: string]: PostsContentfulFilterValue };
  urlParams: { [key: string]: string };
};

export type PostsQueryState = {
  currentPage: number;
  filter: PostsFilterForm;
  sorting: string;
};

export const parsePostsFilters = (
  currentForm: PostsFilterForm,
): ParsedPostsFilters => {
  let contentfulFilter: { [key: string]: PostsContentfulFilterValue } = {};
  let urlParams: { [key: string]: string } = {};

  Object.entries(currentForm).forEach(([key, value]) => {
    if (!value || !(key in exploreFilterMap)) return;

    const formattedParam = exploreFilterMap[key].formatParam(value);
    if (formattedParam[key]) {
      urlParams = { ...urlParams, [key]: formattedParam[key] };
    }

    const formattedForm = exploreFilterMap[key].formatForm(value);
    if (formattedForm[key]) {
      contentfulFilter = {
        ...contentfulFilter,
        [key]: formattedForm[key],
      };
    }
  });

  return { contentfulFilter, urlParams };
};

export const parsePostsQueryState = (
  params: URLSearchParams,
  totalPages: number,
): PostsQueryState => {
  const requestedPage = Number(params.get("page") || 1);
  const currentPage = totalPages >= requestedPage ? requestedPage : 1;

  return {
    currentPage,
    sorting: params.get("sort") || sortingTypes["Mais recente"],
    filter: {
      type_in: parsePostsListParam(params.get("type_in")),
      category: parsePostsListParam(params.get("category")) ?? [],
      date_lte: parsePostsDateParam(params.get("date_lte")),
      date_gte: parsePostsDateParam(params.get("date_gte")),
    },
  };
};

export const buildPostsUrlQuery = (
  currentForm: PostsFilterForm,
  currentPage: number,
): string => {
  const { urlParams } = parsePostsFilters(currentForm);

  return createQueryString({ ...urlParams, page: currentPage.toString() });
};

export const buildPostsContentfulFilter = (
  currentForm: PostsFilterForm,
  rootFilter: { [key: string]: string | string[] },
) => ({
  ...rootFilter,
  ...parsePostsFilters(currentForm).contentfulFilter,
});

export const buildPostsSkip = (currentPage: number) =>
  POSTS_PER_PAGE * (currentPage - 1);

export const buildPostsTotalPages = (totalPosts: number) =>
  Math.ceil(totalPosts / POSTS_PER_PAGE);

const parsePostsListParam = (value: string | null): string[] | undefined =>
  value?.split(",") || undefined;

const parsePostsDateParam = (value: string | null): Date | undefined =>
  Date.parse(value || "") ? new Date(value || "") : undefined;
