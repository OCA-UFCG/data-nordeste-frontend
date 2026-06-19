import { describe, expect, it } from "vitest";
import { getRelatedPanelItems } from "./relatedPanels";
import type { SearchIndexItem } from "./types";

const baseItem = {
  description: "",
  date: null,
  thumb: null,
  tags: [],
  themes: [],
} satisfies Partial<SearchIndexItem>;

describe("related panel helpers", () => {
  it("returns related panels by theme and text score", () => {
    const results = getRelatedPanelItems(buildSearchItems(), {
      title: "Produto Interno Bruto",
      macroTheme: "Economia",
      descriptionTitle: "PIB municipal",
    });

    expect(results.map((item) => item.id)).toEqual(["panel:2", "panel:3"]);
  });

  it("excludes the current panel and respects limit", () => {
    const results = getRelatedPanelItems(
      buildSearchItems(),
      { title: "Produto Interno Bruto", macroTheme: "Economia" },
      { limit: 1 },
    );

    expect(results).toHaveLength(1);
    expect(results[0].title).not.toBe("Produto Interno Bruto");
  });
});

const buildSearchItems = (): SearchIndexItem[] => [
  {
    ...baseItem,
    id: "panel:1",
    source: "panels",
    type: "data-panel-detail",
    title: "Produto Interno Bruto",
    href: "/data-panel/Produto%20Interno%20Bruto",
    themes: ["Economia"],
    text: "produto interno bruto economia pib municipal",
  },
  {
    ...baseItem,
    id: "panel:2",
    source: "panels",
    type: "data-panel-detail",
    title: "Renda municipal",
    href: "/data-panel/Renda%20municipal",
    date: "2026-01-01",
    themes: ["Economia"],
    text: "renda municipal economia pib",
  },
  {
    ...baseItem,
    id: "panel:3",
    source: "panels",
    type: "data-panel-detail",
    title: "Indicadores fiscais",
    href: "/data-panel/Indicadores%20fiscais",
    themes: ["Economia"],
    text: "indicadores fiscais economia",
  },
  {
    ...baseItem,
    id: "post:1",
    source: "post",
    type: "newsletter",
    title: "Boletim economia",
    href: "/posts/boletim-economia",
    text: "economia pib",
  },
];
