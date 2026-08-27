import { describe, expect, it, vi } from "vitest";
import { absoluteUrl } from "@/config/seo";
import { getZenodoCommunityRecords } from "@/lib/zenodo";
import { getSearchIndex } from "@/features/search/contentful";
import type { SearchIndexItem } from "@/features/search/types";
import sitemap from "./sitemap";

vi.mock("@/lib/zenodo", () => ({
  getZenodoCommunityRecords: vi.fn(),
}));

vi.mock("@/features/search/contentful", () => ({
  getSearchIndex: vi.fn(),
}));

const buildItem = (overrides: Partial<SearchIndexItem>): SearchIndexItem => ({
  id: "item-1",
  source: "theme",
  type: "theme",
  title: "Item",
  description: "",
  href: "/macrothemes/item",
  date: null,
  thumb: null,
  themes: [],
  tags: [],
  text: "",
  explorePost: null,
  ...overrides,
});

const mockZenodo = (
  records: Awaited<
    ReturnType<typeof getZenodoCommunityRecords>
  >["records"] = [],
) =>
  vi.mocked(getZenodoCommunityRecords).mockResolvedValue({
    records,
    totalPages: 1,
    currentPage: 1,
  });

const mockSearchIndex = (items: SearchIndexItem[] = []) =>
  vi.mocked(getSearchIndex).mockResolvedValue({
    version: 2,
    generatedAt: new Date().toISOString(),
    items,
  });

describe("sitemap", () => {
  it("always includes the static routes", async () => {
    mockZenodo();
    mockSearchIndex();

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toEqual(
      expect.arrayContaining(
        ["/", "/about", "/connections", "/posts", "/explore", "/catalog"].map(
          absoluteUrl,
        ),
      ),
    );
  });

  it("includes catalog entries built from Zenodo records", async () => {
    mockZenodo([
      {
        id: "42",
        title: "Dataset",
        description: "",
        publication_date: "2024-05-01",
        version: "1.0",
        html: "https://zenodo.org/records/42",
        license: "cc-by-4.0",
        files: [],
      },
    ]);
    mockSearchIndex();

    const entries = await sitemap();

    expect(entries.map((entry) => entry.url)).toContain(
      absoluteUrl("/catalog/42"),
    );
  });

  it("passes through panels, dataStories and theme items directly", async () => {
    mockZenodo();
    mockSearchIndex([
      buildItem({
        source: "panels",
        type: "data-panel-detail",
        href: "/data-panel/painel",
      }),
      buildItem({
        source: "dataStories",
        type: "data-story-detail",
        href: "/data-stories/abc123",
      }),
      buildItem({
        source: "theme",
        type: "theme",
        href: "/macrothemes/economia",
      }),
    ]);

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain(absoluteUrl("/data-panel/painel"));
    expect(urls).toContain(absoluteUrl("/data-stories/abc123"));
    expect(urls).toContain(absoluteUrl("/macrothemes/economia"));
  });

  it("includes newsletter posts and ArcGIS-embed posts, but not other post links", async () => {
    mockZenodo();
    mockSearchIndex([
      buildItem({ source: "post", type: "newsletter", href: "/boletim/1" }),
      buildItem({
        source: "post",
        type: "data-story",
        href: "/data-stories/xyz789",
      }),
      buildItem({
        source: "post",
        type: "additional-content",
        href: "/experience/def456",
      }),
      buildItem({
        source: "post",
        type: "additional-content",
        href: "https://external.example.com/artigo",
      }),
      buildItem({
        source: "post",
        type: "data-panel",
        href: "/data-panel/ja-coberto-pela-fonte-panels",
      }),
    ]);

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain(absoluteUrl("/boletim/1"));
    expect(urls).toContain(absoluteUrl("/data-stories/xyz789"));
    expect(urls).toContain(absoluteUrl("/experience/def456"));
    expect(urls).not.toContain("https://external.example.com/artigo");
    expect(urls).not.toContain(
      absoluteUrl("/data-panel/ja-coberto-pela-fonte-panels"),
    );
  });

  it("deduplicates items from different sources that resolve to the same href", async () => {
    mockZenodo();
    mockSearchIndex([
      buildItem({
        source: "dataStories",
        type: "data-story-detail",
        href: "/data-stories/abc123",
      }),
      buildItem({
        source: "post",
        type: "data-story",
        href: "/data-stories/abc123",
      }),
    ]);

    const entries = await sitemap();
    const matches = entries.filter(
      (entry) => entry.url === absoluteUrl("/data-stories/abc123"),
    );

    expect(matches).toHaveLength(1);
  });

  it("still returns static and content entries when the Zenodo fetch fails", async () => {
    vi.mocked(getZenodoCommunityRecords).mockRejectedValue(
      new Error("zenodo down"),
    );
    mockSearchIndex([
      buildItem({
        source: "theme",
        type: "theme",
        href: "/macrothemes/economia",
      }),
    ]);

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain(absoluteUrl("/"));
    expect(urls).toContain(absoluteUrl("/macrothemes/economia"));
  });

  it("still returns static and catalog entries when the Contentful fetch fails", async () => {
    mockZenodo([
      {
        id: "42",
        title: "Dataset",
        description: "",
        publication_date: "2024-05-01",
        version: "1.0",
        html: "https://zenodo.org/records/42",
        license: "cc-by-4.0",
        files: [],
      },
    ]);
    vi.mocked(getSearchIndex).mockRejectedValue(new Error("contentful down"));

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain(absoluteUrl("/"));
    expect(urls).toContain(absoluteUrl("/catalog/42"));
  });
});
