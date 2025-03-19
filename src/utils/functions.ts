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
  filter: { [key: string]: any },
): Promise<{ fields: IPublication }[]> => {
  const skip = (page - 1) * limit;

  try {
    const params: { [key: string]: any } = {
      content_type: "post",
      order: [sortingTypes[sort]], // Sort by title in ascending order (A-Z)
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

// export getAllowedValues(contentTypeId: string, fieldId: string) {
//   const space = await client.getSpace('your_space_id');
//   const environment = await space.getEnvironment('master'); // or another environment
//   const contentType = await environment.getContentType(contentTypeId);

//   const field = contentType.fields.find(f => f.id === fieldId);

//   if (field && field.validations) {
//     const enumValidation = field.validations.find(v => v.in);
//     return enumValidation ? enumValidation.in : [];
//   }

//   return [];
// }
