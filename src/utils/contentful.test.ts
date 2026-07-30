import { describe, expect, it, vi } from "vitest";
import {
  buildContentfulEndpoint,
  createContentfulClient,
  getCachedContentfulAssetUrl,
} from "./contentful";

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

  it("maps Contentful asset URLs to the local cache proxy", () => {
    expect(
      getCachedContentfulAssetUrl(
        "https://images.ctfassets.net/space/asset/banner.jpg?w=1200&fm=webp",
      ),
    ).toBe("/contentful-assets/space/asset/banner.jpg?w=1200&fm=webp");
    expect(
      getCachedContentfulAssetUrl("//images.ctfassets.net/space/asset/icon.svg"),
    ).toBe("/contentful-assets/space/asset/icon.svg");
    expect(getCachedContentfulAssetUrl("https://example.com/banner.jpg")).toBe(
      "https://example.com/banner.jpg",
    );
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

  it("normalizes Contentful asset URLs in nested GraphQL data", async () => {
    const client = createContentfulClient({
      endpoint: "https://contentful.example.com/graphql",
      fetcher: vi.fn(async () =>
        createResponse({
          body: {
            data: {
              banner: {
                url: "https://images.ctfassets.net/space/asset/banner.jpg?w=800",
              },
              external: { url: "https://example.com/image.jpg" },
            },
          },
        }),
      ) as unknown as typeof fetch,
      preview: true,
      revalidate: 60,
    });

    await expect(client("query Home")).resolves.toEqual({
      banner: { url: "/contentful-assets/space/asset/banner.jpg?w=800" },
      external: { url: "https://example.com/image.jpg" },
    });
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

  it("returns partial data when Contentful reports an unresolvable link", async () => {
    const warning = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const partialData = { postCollection: { items: [{ title: "PIB" }] } };
    const client = createContentfulClient({
      endpoint: "https://contentful.example.com/graphql",
      fetcher: vi.fn(async () =>
        createResponse({
          body: {
            data: partialData,
            errors: [
              {
                message: "Link cannot be resolved",
                extensions: {
                  contentful: {
                    code: "UNRESOLVABLE_LINK",
                    requestId: "request-1",
                    details: {
                      field: "category",
                      linkId: "missing-theme",
                      linkingEntryId: "post-1",
                    },
                  },
                },
              },
            ],
          },
        }),
      ) as unknown as typeof fetch,
      preview: false,
      revalidate: 300,
    });

    await expect(client("query SearchIndex")).resolves.toEqual(partialData);
    expect(warning).toHaveBeenCalledWith(
      JSON.stringify({
        event: "contentful_unresolvable_link",
        requestId: "request-1",
        field: "category",
        linkId: "missing-theme",
        linkingEntryId: "post-1",
      }),
    );
    warning.mockRestore();
  });

  it("rejects unresolvable-link errors when partial data is absent", async () => {
    const client = createContentfulClient({
      endpoint: "https://contentful.example.com/graphql",
      fetcher: vi.fn(async () =>
        createResponse({
          body: {
            errors: [
              {
                message: "Link cannot be resolved",
                extensions: { contentful: { code: "UNRESOLVABLE_LINK" } },
              },
            ],
          },
        }),
      ) as unknown as typeof fetch,
      preview: false,
      revalidate: 300,
    });

    await expect(client("query SearchIndex")).rejects.toThrow(
      "expected data field",
    );
  });
});
