import { describe, expect, it, vi } from "vitest";
import { CONTENTFUL_CACHE_TAG } from "@/config/revalidation";
import { REVALIDATE } from "@/utils/constants";
import type { ReportData } from "@/utils/interfaces";
import { DATA_PANEL_QUERY } from "@/utils/queries";

type CacheCall = { keyParts: string[]; options: object };

const cacheCalls = vi.hoisted((): CacheCall[] => []);

// Grava a configuração do cache em vez de depender do runtime do Next.
vi.mock("next/cache", () => ({
  unstable_cache: (
    fn: (...args: unknown[]) => unknown,
    keyParts: string[],
    options: object,
  ) => {
    cacheCalls.push({ keyParts, options });

    return fn;
  },
}));

const PIB_ENTRY: ReportData = {
  title: "pib",
  date: "2026-02-25T00:00-03:00",
  source: "",
  macroTheme: "Economia e Renda",
};

class PanelContentRequestFake {
  readonly requests: { query: string; variables: { id: string } }[] = [];

  constructor(private readonly items: ReportData[]) {}

  request = async <T>(query: string, variables: { id: string }) => {
    this.requests.push({ query, variables });

    return { panelsCollection: { items: this.items } } as T;
  };
}

describe("createPanelEntryReader", () => {
  it("returns the panels entry titled with the id", async () => {
    const { createPanelEntryReader } = await import("./panelContent");
    const fake = new PanelContentRequestFake([PIB_ENTRY]);

    await expect(createPanelEntryReader(fake.request)("pib")).resolves.toBe(
      PIB_ENTRY,
    );
    expect(fake.requests).toEqual([
      { query: DATA_PANEL_QUERY, variables: { id: "pib" } },
    ]);
  });

  it("returns null when Contentful has no entry for the id", async () => {
    const { createPanelEntryReader } = await import("./panelContent");
    const fake = new PanelContentRequestFake([]);

    await expect(
      createPanelEntryReader(fake.request)("inexistente"),
    ).resolves.toBeNull();
  });

  it("caches the entry and the search items under the Contentful tag", async () => {
    await import("./panelContent");

    expect(cacheCalls).toEqual([
      {
        keyParts: ["panel-entry"],
        options: { revalidate: REVALIDATE, tags: [CONTENTFUL_CACHE_TAG] },
      },
      {
        keyParts: ["panel-search-items"],
        options: { revalidate: REVALIDATE, tags: [CONTENTFUL_CACHE_TAG] },
      },
    ]);
  });
});
