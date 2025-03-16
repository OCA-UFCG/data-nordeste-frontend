import { createClient } from "contentful";
import { IPublication } from "./interfaces";
import { sortingTypes } from "./constants";

const client = createClient({
  accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN || "",
  space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE || "",
});

export const getContent = async (contentTypes: string[]) => {
  const content: any = {};

  for (const type of contentTypes) {
    const res = await client.getEntries({ content_type: type });
    content[type] = res.items;
  }

  return content;
};

export const getTotalPages = async (limit = 10) => {
  try {
    const response = await client.getEntries({
      content_type: "post",
      limit: 1, // Just fetch one entry to get the total count
    });

    const totalEntries = response.total;
    const totalPages = Math.ceil(totalEntries / limit);

    return totalPages;
  } catch (error) {
    console.error("Error fetching total pages:", error);
  }
};

export const getPosts = async (
  sort: string,
  page = 1,
  limit = 12,
): Promise<{ fields: IPublication }[]> => {
  const skip = (page - 1) * limit;

  try {
    const response = await client.getEntries({
      content_type: "post",
      order: [sortingTypes[sort]], // Sort by title in ascending order (A-Z)
      limit: limit,
      skip: skip,
    });

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
