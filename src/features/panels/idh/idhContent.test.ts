import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReportData } from "@/utils/interfaces";
import { DATA_PANEL_QUERY } from "@/utils/queries";

const contentful = vi.hoisted(() => ({
  requests: [] as { query: string; variables: object }[],
  items: [] as ReportData[],
  failure: null as Error | null,
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

vi.mock("@/utils/contentful", () => ({
  getContent: async (query: string, variables: object) => {
    contentful.requests.push({ query, variables });
    if (contentful.failure) throw contentful.failure;

    return { panelsCollection: { items: contentful.items } };
  },
}));

vi.mock("@/features/search/contentful", () => ({
  getSearchIndex: async () => ({ items: [] }),
}));

const IDH_ENTRY: ReportData = {
  title: "idh",
  date: "2026-02-25T00:00-03:00",
  source: "https://app.powerbi.com/view?r=idh",
  macroTheme: "Desenvolvimento Social",
};

afterEach(() => {
  contentful.requests.length = 0;
  contentful.items = [];
  contentful.failure = null;
});

describe("loadIdhPanelContent", () => {
  it("reads the panels entry titled idh", async () => {
    const { loadIdhPanelContent } = await import("./idhContent");

    contentful.items = [IDH_ENTRY];

    await expect(loadIdhPanelContent()).resolves.toEqual({
      panel: IDH_ENTRY,
      relatedItems: [],
    });
    expect(contentful.requests).toEqual([
      { query: DATA_PANEL_QUERY, variables: { id: "idh" } },
    ]);
  });

  it("returns null and logs when the entry is missing", async () => {
    const { loadIdhPanelContent } = await import("./idhContent");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(loadIdhPanelContent()).resolves.toBeNull();
    expect(JSON.parse(String(log.mock.calls[0][0]))).toMatchObject({
      event: "idh_demo_content_failed",
      id: "idh",
    });
  });

  it("returns null when Contentful fails, so the panel still renders", async () => {
    const { loadIdhPanelContent } = await import("./idhContent");

    vi.spyOn(console, "error").mockImplementation(() => {});
    contentful.failure = new Error("Contentful request failed");

    await expect(loadIdhPanelContent()).resolves.toBeNull();
  });
});
