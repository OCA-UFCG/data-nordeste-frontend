import { describe, expect, it, vi } from "vitest";
import { getContent } from "@/utils/contentful";
import { getSearchIndex } from "./contentful";

vi.mock("@/utils/contentful", () => ({
  getContent: vi.fn(),
}));

describe("Contentful search index", () => {
  it("maps public Contentful fields into compact searchable items", async () => {
    vi.mocked(getContent).mockResolvedValue({
      postCollection: {
        items: [
          {
            sys: { id: "post-1" },
            title: "Acessar Painel: PIB",
            type: "data-panel",
            date: "2026-01-01",
            description: "Produto interno bruto",
            link: "/data-panel/pib",
            thumb: { url: "https://images.ctfassets.net/thumb.png" },
            categoryCollection: {
              items: [
                {
                  sys: { id: "theme-1" },
                  id: "economia_e_renda",
                  name: "Economia e Renda",
                  tags: ["PIB", "Emprego"],
                },
              ],
            },
          },
          {
            sys: { id: "story-post" },
            title: "Explore Nordeste",
            type: "data-story",
            date: "2025-01-01",
            description: "",
            link: "https://storymaps.arcgis.com/stories/21bae45539be473f8666d857c481d443",
            categoryCollection: { items: [] },
          },
        ],
      },
      panelsCollection: {
        items: [
          {
            sys: { id: "panel-1" },
            title: "pib",
            date: "2026-01-01",
            macroTheme: "Economia e Renda",
            descriptionTitle: "Painel PIB",
            description: "Detalhes do painel",
          },
        ],
      },
      dataStoriesCollection: {
        items: [{ sys: { id: "story-1" }, id: "abc123" }],
      },
      themeCollection: {
        items: [
          {
            sys: { id: "theme-1" },
            id: "economia_e_renda",
            name: "Economia e Renda",
            tags: ["PIB"],
            articleTitle: "Panorama econômico",
            banner: { url: "https://images.ctfassets.net/banner.png" },
          },
        ],
      },
    });

    const index = await getSearchIndex();

    expect(index.version).toBe(1);
    expect(index.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "post:post-1",
          title: "PIB",
          href: "/data-panel/pib",
          text: expect.stringContaining("produto interno bruto"),
          themes: ["Economia e Renda"],
          tags: ["PIB", "Emprego"],
        }),
        expect.objectContaining({
          id: "post:story-post",
          href: "/data-stories/21bae45539be473f8666d857c481d443",
        }),
        expect.objectContaining({
          id: "panel:panel-1",
          href: "/data-panel/pib",
          title: "Painel PIB",
          description: "Detalhes do painel",
        }),
        expect.objectContaining({
          id: "theme:theme-1",
          href: "/macrothemes/economia-e-renda",
          type: "theme",
        }),
      ]),
    );
  });
});
