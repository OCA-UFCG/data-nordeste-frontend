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
  it("favors related content in different themes", () => {
    const results = getRelatedPanelItems(buildSearchItems(), {
      title: "Produto Interno Bruto",
      macroTheme: "Economia",
      descriptionTitle: "PIB municipal",
    });

    expect(results.map((item) => item.id)).toEqual([
      "post:story",
      "post:newsletter",
      "panel:2",
    ]);
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

  it("excludes the current panel by href when display titles differ", () => {
    const results = getRelatedPanelItems(buildSearchItems(), {
      title: "Painel Produto Interno Bruto",
      href: "/data-panel/Produto%20Interno%20Bruto",
      macroTheme: "Economia",
      descriptionTitle: "PIB municipal",
    });

    expect(results.map((item) => item.id)).toEqual([
      "post:story",
      "post:newsletter",
      "panel:2",
    ]);
  });

  it("does not recommend unrelated content from different themes", () => {
    const results = getRelatedPanelItems(buildSearchItems(), {
      title: "Produto Interno Bruto",
      macroTheme: "Economia",
      descriptionTitle: "PIB municipal",
    });

    expect(results.map((item) => item.id)).not.toContain("post:unrelated");
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
    id: "post:newsletter",
    source: "post",
    type: "newsletter",
    title: "Boletim sobre PIB municipal",
    href: "/posts/boletim-economia",
    themes: ["Mercado de Trabalho"],
    tags: ["PIB"],
    text: "boletim mercado trabalho pib municipal",
  },
  {
    ...baseItem,
    id: "post:story",
    source: "post",
    type: "data-story",
    title: "Datastory do PIB municipal",
    href: "/data-stories/story-id",
    themes: ["Território"],
    tags: ["PIB"],
    text: "datastory territorio produto pib municipal renda",
  },
  {
    ...baseItem,
    id: "post:unrelated",
    source: "post",
    type: "newsletter",
    title: "Boletim climático",
    href: "/posts/boletim-climatico",
    themes: ["Meio Ambiente"],
    text: "clima chuva semiárido",
  },
];
