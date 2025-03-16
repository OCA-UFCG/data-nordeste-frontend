import { createClient } from "contentful";

export const getContent = async (contentTypes: string[]) => {
  const client = createClient({
    accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN || "",
    space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE || "",
  });
  const content: any = {};

  for (const type of contentTypes) {
    const res = await client.getEntries({ content_type: type });
    content[type] = res.items;
  }

  return content;
};

export const getContentSorted = async (contentTypes: string[], order: any) => {
  const client = createClient({
    accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN || "",
    space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE || "",
  });

  const content: any = {};

  for (const type of contentTypes) {
    const res = await client.getEntries({ content_type: type, order });
    content[type] = res.items;
  }

  return content;
};

export const capitalize = (inputString: string): string => {
  return inputString
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
