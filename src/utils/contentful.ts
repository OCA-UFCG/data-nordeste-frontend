const ENVIRONMENT = process.env.CONTENTFUL_ENVIRONMENT || "master";
const ACCESS_TOKEN = process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN || "";
const SPACE_ID = process.env.NEXT_PUBLIC_CONTENTFUL_SPACE || "";
const CONTENTFUL_ENPOINT = `https://graphql.contentful.com/content/v1/spaces/${SPACE_ID}/environments/${ENVIRONMENT}`;

export async function getContent<T>(
  query: string,
  variables?: Record<string, any>,
): Promise<T> {
  const response = await fetch(CONTENTFUL_ENPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const json = await response.json();

  if (json.errors) {
    throw new Error(JSON.stringify(json.errors, null, 2));
  }

  return json.data;
}
