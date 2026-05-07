import { describe, expect, it, vi } from "vitest";
import { buildContentfulEndpoint, createContentfulClient } from "./contentful";

const createResponse = ({
  body,
  ok = true,
  status = 200,
  text = "",
}: {
  body: unknown;
  ok?: boolean;
  status?: number;
  text?: string;
}) =>
  ({
    ok,
    status,
    json: async () => body,
    text: async () => text,
  }) as Response;

describe("Contentful client", () => {
  it("builds the direct GraphQL endpoint when space and token exist", () => {
    expect(
      buildContentfulEndpoint({
        NEXT_PUBLIC_CONTENTFUL_SPACE: "space-id",
        NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN: "token",
        NEXT_PUBLIC_HOST_URL: "https://fallback.example.com",
      }),
    ).toBe("https://graphql.contentful.com/content/v1/spaces/space-id");
  });

  it("builds the proxy endpoint from the host url without trailing slash", () => {
    expect(
      buildContentfulEndpoint({
        NEXT_PUBLIC_HOST_URL: "https://portal.example.com/",
      }),
    ).toBe("https://portal.example.com/contentful-api");
  });

  it("sends preview variables, headers, and revalidation options", async () => {
    const fetcher = vi.fn(async () =>
      createResponse({ body: { data: { ok: true } } }),
    ) as unknown as typeof fetch;
    const client = createContentfulClient({
      accessToken: "token",
      endpoint: "https://contentful.example.com/graphql",
      fetcher,
      preview: true,
      revalidate: 60,
    });

    await expect(client("query Home", { limit: 8 })).resolves.toEqual({
      ok: true,
    });
    expect(fetcher).toHaveBeenCalledWith(
      "https://contentful.example.com/graphql",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer token",
        },
        next: { revalidate: 60 },
        body: JSON.stringify({
          query: "query Home",
          variables: { limit: 8, preview: true },
        }),
      }),
    );
  });

  it("throws readable errors for HTTP and GraphQL failures", async () => {
    const httpClient = createContentfulClient({
      endpoint: "https://contentful.example.com/graphql",
      fetcher: vi.fn(async () =>
        createResponse({
          body: {},
          ok: false,
          status: 500,
          text: "upstream down",
        }),
      ) as unknown as typeof fetch,
      preview: false,
      revalidate: 300,
    });
    const graphQlClient = createContentfulClient({
      endpoint: "https://contentful.example.com/graphql",
      fetcher: vi.fn(async () =>
        createResponse({ body: { errors: [{ message: "bad query" }] } }),
      ) as unknown as typeof fetch,
      preview: false,
      revalidate: 300,
    });

    await expect(httpClient("query")).rejects.toThrow(
      'Contentful request failed for endpoint "https://contentful.example.com/graphql" with status 500',
    );
    await expect(graphQlClient("query")).rejects.toThrow(
      'Contentful GraphQL returned errors for variables {"preview":false}',
    );
  });
});
