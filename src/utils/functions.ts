import { createClient } from "contentful";

import { IPublication } from "./interfaces";
import { POSTS_PER_PAGE } from "./constants";

const DEFAULT_HOST = "cdn.contentful.com";

const client = createClient({
  accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN || "",
  space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE || "",
  host: process.env.NEXT_PUBLIC_CONTENTFUL_HOST || DEFAULT_HOST,
});

export const getContent = async (contentTypes: string[]) => {
  const content: any = {};

  for (const type of contentTypes) {
    const res = await client.getEntries({ content_type: type });
    content[type] = res.items;
  }

  return content;
};

export const getTotalPages = async (filter = {}) => {
  try {
    const params: { [key: string]: any } = {
      content_type: "post",
      limit: 1,
    };

    Object.entries(filter).map(([key, value]) => {
      params[key] = value;
    });

    const response = await client.getEntries(params);

    const totalEntries = response.total;
    const totalPages = Math.ceil(totalEntries / POSTS_PER_PAGE);

    return totalPages;
  } catch (error) {
    console.error("Error fetching total pages:", error);
  }
};

export const getPosts = async (
  sort: string,
  page = 1,
  limit = 12,
  filter: { [key: string]: any },
): Promise<{ fields: IPublication }[]> => {
  const skip = (page - 1) * limit;

  try {
    const params: { [key: string]: any } = {
      content_type: "post",
      order: [sort],
      limit: limit,
      skip: skip,
    };

    Object.entries(filter).map(([key, value]) => {
      params[key] = value;
    });

    const response = await client.getEntries(params);

    return response.items as unknown as { fields: IPublication }[];
  } catch (error) {
    console.error("Error fetching page:", error);

    return [];
  }
};

export const capitalize = (inputString: string): string => {
  return inputString
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const sortContentByDesiredOrder = <T extends { id: string }>(
  content: { fields: T }[],
  desiredOrder: string[],
): { fields: T }[] => {
  return [...content].sort((a, b) => {
    const aIndex = desiredOrder.indexOf(a.fields.id);
    const bIndex = desiredOrder.indexOf(b.fields.id);

    return (
      (aIndex === -1 ? Infinity : aIndex) - (bIndex === -1 ? Infinity : bIndex)
    );
  });
};

export const createQueryString = (newParams: { [key: string]: string }) => {
  const searchParams = new URLSearchParams();

  Object.entries(newParams).forEach(([name, value]) => {
    searchParams.set(name, value);
  });

  return searchParams.toString();
};

export const isHrefActive = (
  pathname: string,
  category: string | null,
  href?: string | null,
): boolean => {
  if (!href) return false;

  const [hrefPath, hrefQuery] = href.split("?");
  const hrefParams = new URLSearchParams(hrefQuery).get("category");

  return pathname === hrefPath && hrefParams === category;
};
