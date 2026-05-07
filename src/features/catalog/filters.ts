import { Filters, FilterGroup } from "@/utils/interfaces";

export type CatalogFilterGroupFields = {
  title: string;
  type: string;
  fields: { [key: string]: string };
};

export const buildCatalogFilterValues = (
  params: URLSearchParams,
  filters: FilterGroup[],
): Filters => {
  const values: Filters = {
    date_gte: parseCatalogDate(params.get("date_gte")),
    date_lte: parseCatalogDate(params.get("date_lte")),
    sort: params.get("sort") || undefined,
  };

  filters.forEach(({ type }) => {
    values[type] = parseCatalogList(params.get(type));
  });

  return values;
};

export const buildCatalogUrlParams = (
  filters: Filters,
  page: number,
): URLSearchParams => {
  const urlParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    appendCatalogFilterParam(urlParams, key, value);
  });

  if (page > 1) urlParams.set("page", page.toString());

  return urlParams;
};

export const buildCatalogFilterGroups = (
  filters: FilterGroup[],
): CatalogFilterGroupFields[] =>
  filters.map(({ title, type, options }) => ({
    title,
    type,
    fields: Object.fromEntries(options.map(({ slug, title }) => [slug, title])),
  }));

export const buildCatalogSlugTitleMap = (filters: FilterGroup[]) => {
  const slugTitleMap: { [slug: string]: string } = {};

  filters.forEach((filter) => {
    filter.options.forEach((option) => {
      slugTitleMap[option.slug] = option.title;
    });
  });

  return slugTitleMap;
};

const parseCatalogDate = (value: string | null): Date | undefined =>
  value ? new Date(value) : undefined;

const parseCatalogList = (value: string | null): string[] =>
  value ? value.split(",").filter(Boolean) : [];

const appendCatalogFilterParam = (
  urlParams: URLSearchParams,
  key: string,
  value: Filters[string],
) => {
  if (!value) return;

  if (Array.isArray(value) && value.length > 0) {
    urlParams.set(key, value.join(","));

    return;
  }

  if (value instanceof Date) {
    urlParams.set(key, value.toISOString());

    return;
  }

  if (typeof value === "string") {
    urlParams.set(key, value);
  }
};
