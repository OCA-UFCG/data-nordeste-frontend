import { describe, expect, it, vi } from "vitest";
import type { ReportData } from "@/utils/interfaces";
import { DATA_PANEL_QUERY } from "@/utils/queries";

const contentful = vi.hoisted(() => ({
  requests: [] as { query: string; variables: object }[],
}));

const POPULACAO_ENTRY: ReportData = {
  title: "populacao",
  date: "2026-02-25T00:00-03:00",
  source: "https://app.powerbi.com/view?r=populacao",
  macroTheme: "Desenvolvimento Social",
};

vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

vi.mock("@/utils/contentful", () => ({
  getContent: async (query: string, variables: object) => {
    contentful.requests.push({ query, variables });

    return { panelsCollection: { items: [POPULACAO_ENTRY] } };
  },
}));

vi.mock("@/features/search/contentful", () => ({
  getSearchIndex: async () => ({ items: [] }),
}));

describe("loadDemografiaPanelContent", () => {
  it("reads the panels entry titled populacao", async () => {
    const { loadDemografiaPanelContent } = await import("./demografiaContent");

    await expect(loadDemografiaPanelContent()).resolves.toEqual({
      panel: POPULACAO_ENTRY,
      relatedItems: [],
    });
    expect(contentful.requests).toEqual([
      { query: DATA_PANEL_QUERY, variables: { id: "populacao" } },
    ]);
  });
});
