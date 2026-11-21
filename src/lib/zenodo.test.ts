import { afterEach, describe, expect, it, vi } from "vitest";
import { ZENODO_BASE_URL } from "@/utils/constants";
import {
  buildZenodoRecordsQuery,
  parseZenodoRecords,
  pingZenodoCommunity,
} from "./zenodo";

describe("buildZenodoRecordsQuery", () => {
  it("builds the Zenodo community query with date and array filters", () => {
    const query = buildZenodoRecordsQuery(2, 6, {
      category: ["Saúde", "Educação"],
      date_gte: new Date("2024-01-01T00:00:00.000Z"),
      date_lte: new Date("2024-12-31T00:00:00.000Z"),
      sort: "mostrecent",
    });

    expect(query.get("communities")).toBe("datane");
    expect(query.get("page")).toBe("2");
    expect(query.get("size")).toBe("6");
    expect(query.get("sort")).toBe("mostrecent");
    expect(query.get("q")).toBe(
      'publication_date:[2024-01-01 TO 2024-12-31] AND ("Saúde" OR "Educação")',
    );
  });

  it("omits empty filters from the Zenodo query", () => {
    const query = buildZenodoRecordsQuery(1, 6, {
      category: [],
      sort: undefined,
    });

    expect(query.get("q")).toBeNull();
    expect(query.get("sort")).toBeNull();
  });

  it("searches the full catalog when a category is also present", () => {
    const query = buildZenodoRecordsQuery(1, 6, {
      category: ["saude"],
      search: "mortalidade infantil",
    });

    expect(query.get("q")).toBe("mortalidade* AND infantil*");
  });

  it("uses prefix matching while the catalog term is incomplete", () => {
    const query = buildZenodoRecordsQuery(1, 6, {
      search: "sanea",
    });

    expect(query.get("q")).toBe("sanea*");
  });
});

describe("parseZenodoRecords", () => {
  it("maps Zenodo records into catalog metadata", () => {
    const records = parseZenodoRecords({
      hits: {
        total: 1,
        hits: [
          {
            id: 123,
            created: "2025-01-15T00:00:00Z",
            metadata: {
              title: "Indicador regional",
              description: "<p>Resumo</p>",
              keywords: ["saude"],
              license: { id: "cc-by-4.0" },
            },
            links: {
              self_html: "https://zenodo.org/records/123",
            },
            files: [
              {
                key: "dados.csv",
                links: { self: "https://zenodo.org/api/files/dados.csv" },
              },
            ],
          },
        ],
      },
    });

    expect(records).toEqual([
      {
        id: "123",
        title: "Indicador regional",
        description: "<p>Resumo</p>",
        publication_date: "2025-01-15T00:00:00Z",
        version: "1.0",
        tags: ["saude"],
        html: "https://zenodo.org/records/123",
        license: "cc-by-4.0",
        files: [
          {
            name: "dados.csv",
            downloadUrl: "https://zenodo.org/api/files/dados.csv",
          },
        ],
      },
    ]);
  });
});

/** Answers every Zenodo request with one status. */
class ZenodoFetchFake {
  constructor(private readonly status: number) {}

  readonly fetch = vi.fn<
    (url: string, init?: RequestInit) => Promise<Response>
  >(async () => new Response(null, { status: this.status }));
}

describe("pingZenodoCommunity", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("asks the catalog's community query, uncached, and returns the status", async () => {
    const zenodo = new ZenodoFetchFake(503);
    vi.stubGlobal("fetch", zenodo.fetch);
    const signal = new AbortController().signal;

    const status = await pingZenodoCommunity(signal);

    const [url, init] = zenodo.fetch.mock.calls[0];
    expect(status).toBe(503);
    expect(url).toBe(
      `${ZENODO_BASE_URL}?${buildZenodoRecordsQuery(1, 1, {}).toString()}`,
    );
    expect(init?.cache).toBe("no-store");
    expect(init?.signal).toBe(signal);
  });

  it("sends the User-Agent that Zenodo's Cloudflare lets through", async () => {
    const zenodo = new ZenodoFetchFake(200);
    vi.stubGlobal("fetch", zenodo.fetch);

    await pingZenodoCommunity();

    expect(zenodo.fetch.mock.calls[0][1]?.headers).toMatchObject({
      "User-Agent": expect.stringContaining("data-nordeste-portal"),
    });
  });
});
