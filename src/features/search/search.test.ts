import { describe, expect, it } from "vitest";
import {
  normalizeSearchText,
  searchItems,
  getSearchGroupKey,
  getSearchTypeLabel,
} from "./search";
import type { SearchIndexItem } from "./types";

const baseItem = {
  description: "",
  date: null,
  thumb: null,
  tags: [],
  themes: [],
  explorePost: null,
} satisfies Partial<SearchIndexItem>;

describe("search helpers", () => {
  it("normalizes accents, case, and punctuation", () => {
    expect(normalizeSearchText(" População, Água & PIB ")).toBe(
      "populacao agua pib",
    );
  });

  it("ranks title matches first, deduplicates hrefs, and applies limit", () => {
    const items: SearchIndexItem[] = [
      {
        ...baseItem,
        id: "theme:1",
        source: "theme",
        type: "theme",
        title: "Economia e Renda",
        href: "/macrothemes/economia-e-renda",
        tags: ["PIB"],
        text: "economia e renda pib",
      },
      {
        ...baseItem,
        id: "post:1",
        source: "post",
        type: "data-panel",
        title: "PIB",
        href: "/data-panel/pib",
        date: "2026-01-01",
        themes: ["Economia e Renda"],
        text: "pib economia e renda",
      },
      {
        ...baseItem,
        id: "panel:1",
        source: "panels",
        type: "data-panel-detail",
        title: "Produto interno bruto",
        href: "/data-panel/pib",
        date: "2025-01-01",
        text: "produto interno bruto pib",
      },
      {
        ...baseItem,
        id: "post:2",
        source: "post",
        type: "newsletter",
        title: "Emprego",
        href: "/posts/emprego",
        text: "emprego",
      },
    ];

    const results = searchItems(items, "pib", { limit: 2 });

    expect(results.map((item) => item.href)).toEqual([
      "/data-panel/pib",
      "/macrothemes/economia-e-renda",
    ]);
    expect(results[0].id).toBe("post:1");
  });

  it("labels and groups result types", () => {
    expect(getSearchTypeLabel({ type: "data-story" })).toBe("Datastory");
    expect(getSearchTypeLabel({ type: "theme" })).toBe("Macrotema");
    expect(getSearchGroupKey({ type: "data-panel-detail" })).toBe("panels");
    expect(getSearchGroupKey({ type: "newsletter" })).toBe("content");
  });
});
