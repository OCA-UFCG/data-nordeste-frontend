import { describe, expect, it } from "vitest";
import type { SearchIndexItem } from "@/features/search/types";
import { buildSearchText } from "@/features/search/search";
import { selectLocalExploreResults } from "./localResults";

function post(
  id: string,
  title: string,
  type: "data-panel" | "data-story" | "newsletter",
  date: string,
  themeId: string,
): SearchIndexItem {
  return {
    id: `post:${id}`,
    source: "post",
    type,
    title,
    description: `${title} descrição`,
    href: `/${id}`,
    date,
    thumb: `/${id}.png`,
    themes: [themeId],
    tags: [],
    text: buildSearchText([title, "descrição"]),
    explorePost: { contentfulId: id, link: `/${id}`, themeIds: [themeId] },
  };
}

const items = [
  post("painel-1", "Água regional", "data-panel", "2025-01-01", "agua"),
  post("painel-2", "Água potável", "data-panel", "2026-01-01", "agua"),
  post("narrativa", "Água no sertão", "data-story", "2024-01-01", "agua"),
  post("boletim", "Economia", "newsletter", "2023-01-01", "economia"),
];

const cagedPost = post(
  "caged",
  "Cadastro Geral de Empregados e Desempregados (CAGED)",
  "data-panel",
  "2026-04-30",
  "economia",
);
const cagedDetail: SearchIndexItem = {
  ...cagedPost,
  id: "panel:caged",
  source: "panels",
  type: "data-panel-detail",
  description: "Indicadores do mercado de trabalho",
  text: buildSearchText(["Indicadores do mercado de trabalho"]),
  explorePost: null,
};

describe("selectLocalExploreResults", () => {
  it("combines normalized search, theme, tab, and alphabetical sorting", () => {
    const params = new URLSearchParams(
      "q=agua&category=agua&type_in=data-panel&sort=title_ASC&page=1",
    );
    const selection = selectLocalExploreResults(items, params);

    expect(selection.results.items.map((item) => item.title)).toEqual([
      "Água potável",
      "Água regional",
    ]);
    expect(selection.results.tabTotals).toEqual({
      dashboards: 2,
      datastories: 1,
      publications: 0,
      analyses: 2,
    });
  });

  it("filters the analyses tab by panel and year", () => {
    const byPanel = selectLocalExploreResults(
      items,
      new URLSearchParams("type_in=analysis&panel=painel-2"),
    );
    const byYear = selectLocalExploreResults(
      items,
      new URLSearchParams("type_in=analysis&year=2025"),
    );

    expect(byPanel.results.items.map((item) => item.title)).toEqual([
      "Água potável",
    ]);
    expect(byYear.results.items.map((item) => item.title)).toEqual([
      "Água regional",
    ]);
    expect(byPanel.analysesOptions.years).toEqual(["2026", "2025"]);
  });

  it("keeps the analyses tab selected even without analyses", () => {
    const selection = selectLocalExploreResults(
      items.filter((item) => item.type === "newsletter"),
      new URLSearchParams("type_in=analysis&page=1"),
    );

    expect(selection.activeTab).toBe("analises");
    expect(selection.results.items).toEqual([]);
  });

  it("selects the first available tab and clamps an invalid page", () => {
    const selection = selectLocalExploreResults(
      items,
      new URLSearchParams("q=economia&type_in=data-story&page=99"),
    );

    expect(selection.activeTab).toBe("boletins");
    expect(selection.currentPage).toBe(1);
    expect(selection.results.items[0].sys?.id).toBe("boletim");
  });

  it("returns a panel card when its indexed detail matches the query", () => {
    const selection = selectLocalExploreResults(
      [...items, cagedPost, cagedDetail],
      new URLSearchParams("q=traba&type_in=data-panel&page=1"),
    );

    expect(selection.activeTab).toBe("paineis");
    expect(selection.results.items.map((item) => item.title)).toEqual([
      "Cadastro Geral de Empregados e Desempregados (CAGED)",
    ]);
  });
});
