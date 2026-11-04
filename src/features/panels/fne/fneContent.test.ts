import { describe, expect, it, vi } from "vitest";
import type { ReportData } from "@/utils/interfaces";
import { DATA_PANEL_QUERY } from "@/utils/queries";

const contentful = vi.hoisted(() => ({
  requests: [] as { query: string; variables: object }[],
}));

const FNE_ENTRY: ReportData = {
  title: "fundo_financiamento",
  date: "2026-06-18T00:00-03:00",
  source:
    "https://experience.arcgis.com/experience/e8599bfc65ac4425a741fef899c8c7b1",
  macroTheme: "Instrumentos Sudene",
};

vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

vi.mock("@/utils/contentful", () => ({
  getContent: async (query: string, variables: object) => {
    contentful.requests.push({ query, variables });

    return { panelsCollection: { items: [FNE_ENTRY] } };
  },
}));

vi.mock("@/features/search/contentful", () => ({
  getSearchIndex: async () => ({ items: [] }),
}));

describe("loadFnePanelContent", () => {
  it("reads the panels entry titled fundo_financiamento", async () => {
    const { loadFnePanelContent } = await import("./fneContent");

    await expect(loadFnePanelContent()).resolves.toEqual({
      panel: FNE_ENTRY,
      relatedItems: [],
    });
    expect(contentful.requests).toEqual([
      { query: DATA_PANEL_QUERY, variables: { id: "fundo_financiamento" } },
    ]);
  });
});
