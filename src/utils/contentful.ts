import { REVALIDATE } from "./constants";

const USE_PREVIEW = process.env.NEXT_PUBLIC_CONTENTFUL_PREVIEW ? true : false;
const CONTENTFUL_ACCESS_TOKEN = process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN;

type ContentfulEnv = {
  NEXT_PUBLIC_CONTENTFUL_PREVIEW?: string;
  NEXT_PUBLIC_CONTENTFUL_SPACE?: string;
  NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN?: string;
  NEXT_PUBLIC_HOST_URL?: string;
};

type ContentfulClientConfig = {
  accessToken?: string;
  endpoint: string;
  fetcher?: typeof fetch;
  preview: boolean;
  revalidate: number;
};

type ContentfulVariable =
  | string
  | number
  | boolean
  | null
  | ContentfulVariable[]
  | { [key: string]: ContentfulVariable };

type ContentfulVariables = { [key: string]: ContentfulVariable };

export function buildContentfulEndpoint(env: ContentfulEnv): string {
  const space = env.NEXT_PUBLIC_CONTENTFUL_SPACE;
  const accessToken = env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN;

  if (space && accessToken) {
    return `https://graphql.contentful.com/content/v1/spaces/${space}`;
  }

  const hostUrl = env.NEXT_PUBLIC_HOST_URL || "http://localhost:3000";
  const base = hostUrl.replace(/\/+$/, "");

  // LEGACY: /contentful-api is a required production fallback served by the
  // deployment Nginx proxy when direct Contentful GraphQL env vars are absent.
  return `${base}/contentful-api`;
}

export function createContentfulClient({
  accessToken,
  endpoint,
  fetcher = fetch,
  preview,
  revalidate,
}: ContentfulClientConfig) {
  return async function requestContentful<T>(
    query: string,
    variables?: ContentfulVariables,
  ): Promise<T> {
    const finalVariables = { ...variables, preview };

    const response = await fetcher(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      next: {
        revalidate,
      },

      body: JSON.stringify({
        query,
        variables: finalVariables,
      }),
    });

    if (!response.ok) {
      const responseBody = await response.text();

      throw new Error(
        `Contentful request failed for endpoint "${endpoint}" with status ${response.status}; expected GraphQL JSON response. Body: ${responseBody}`,
      );
    }

    const json = await response.json();

    if (json.errors) {
      throw new Error(
        `Contentful GraphQL returned errors for variables ${JSON.stringify(finalVariables)}; expected data field. Errors: ${JSON.stringify(json.errors)}`,
      );
    }

    return json.data;
  };
}

const CONTENTFUL_ENDPOINT = buildContentfulEndpoint({
  NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN: CONTENTFUL_ACCESS_TOKEN,
  NEXT_PUBLIC_CONTENTFUL_SPACE: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE,
  NEXT_PUBLIC_HOST_URL: process.env.NEXT_PUBLIC_HOST_URL,
});

export const getContent = createContentfulClient({
  accessToken: CONTENTFUL_ACCESS_TOKEN,
  endpoint: CONTENTFUL_ENDPOINT,
  preview: USE_PREVIEW,
  revalidate: REVALIDATE,
});
