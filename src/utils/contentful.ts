const USE_PREVIEW = process.env.NEXT_PUBLIC_CONTENTFUL_PREVIEW ? true : false;
const CONTENTFUL_ENDPOINT =
  process.env.NEXT_PUBLIC_CONTENTFUL_ENDPOINT ||
  `${process.env.NEXT_PUBLIC_HOST_URL?.replace(/\/$/, "")}/contentful-api`;

const hasOnlyUnresolvableLinkErrors = (errors: any[]) =>
  errors.every(
    (error) => error.extensions?.contentful?.code === "UNRESOLVABLE_LINK",
  );

export async function getContent<T>(
  query: string,
  variables?: Record<string, any>,
  options?: { ignoreUnresolvableLinks?: boolean },
): Promise<T> {
  variables = { ...variables, preview: USE_PREVIEW };

  const response = await fetch(CONTENTFUL_ENDPOINT, {
    method: "POST",

    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const json = await response.json();

  if (json.errors) {
    if (
      options?.ignoreUnresolvableLinks &&
      json.data &&
      hasOnlyUnresolvableLinkErrors(json.errors)
    ) {
      return json.data;
    }

    throw new Error(JSON.stringify(json.errors, null, 2));
  }

  return json.data;
}
