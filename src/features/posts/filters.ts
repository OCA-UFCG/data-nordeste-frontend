import { exploreFilterMap } from "@/utils/constants";

export type PostsFilterForm = {
  [key: string]: string | string[] | Date | undefined;
};

export type ParsedPostsFilters = {
  contentfulFilter: { [key: string]: string | string[] };
  urlParams: { [key: string]: string };
};

export const parsePostsFilters = (
  currentForm: PostsFilterForm,
): ParsedPostsFilters => {
  let contentfulFilter: { [key: string]: string | string[] } = {};
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
