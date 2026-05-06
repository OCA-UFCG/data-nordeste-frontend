import { REVALIDATE } from "./constants";

const USE_PREVIEW = process.env.NEXT_PUBLIC_CONTENTFUL_PREVIEW ? true : false;
const CONTENTFUL_SPACE = process.env.NEXT_PUBLIC_CONTENTFUL_SPACE;
const CONTENTFUL_ACCESS_TOKEN = process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN;

function buildContentfulEndpoint(): string {
  if (CONTENTFUL_SPACE && CONTENTFUL_ACCESS_TOKEN) {
    return `https://graphql.contentful.com/content/v1/spaces/${CONTENTFUL_SPACE}`;
  }

  const hostUrl = process.env.NEXT_PUBLIC_HOST_URL || "http://localhost:3000";
  const base = hostUrl.replace(/\/+$/, "");

  return `${base}/contentful-api`;
}

const CONTENTFUL_ENDPOINT = buildContentfulEndpoint();

export async function getContent<T>(
  query: string,
  variables?: Record<string, any>,
): Promise<T> {
  variables = { ...variables, preview: USE_PREVIEW };

  const response = await fetch(CONTENTFUL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(CONTENTFUL_ACCESS_TOKEN
        ? { Authorization: `Bearer ${CONTENTFUL_ACCESS_TOKEN}` }
        : {}),
    },
    next: {
      revalidate: REVALIDATE,
    },

    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Contentful request failed with status ${response.status}: ${await response.text()}`,
    );
  }

  const json = await response.json();

  if (json.errors) {
    throw new Error(JSON.stringify(json.errors, null, 2));
  }

  return json.data;
}
