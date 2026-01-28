const USE_PREVIEW = process.env.NEXT_PUBLIC_CONTENTFUL_PREVIEW ? true : false;
const CONTENTFUL_ENDPOINT = `https://beta-datanordeste.lsd.ufcg.edu.br/contentful-api`;

export async function getContent<T>(
  query: string,
  variables?: Record<string, any>,
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
    throw new Error(JSON.stringify(json.errors, null, 2));
  }

  return json.data;
}
