import { describe, expect, it } from "vitest";
import type { IPublication } from "@/utils/interfaces";
import {
  ALL_OPTION,
  filterAnalyses,
  listAnalysesYears,
} from "./analysesFilters";

const analysis = (
  title: string,
  date: string,
  panelId?: string,
): IPublication => ({
  sys: { id: title },
  title,
  link: `/${title}`,
  thumb: { url: "" },
  type: "analysis",
  date,
  panel: panelId ? { sys: { id: panelId } } : null,
});

const posts = [
  analysis("Seca", "2025-03-01", "painel-agua"),
  analysis("Água", "2026-01-10", "painel-agua"),
  analysis("Renda", "2026-05-20", "painel-renda"),
];

describe("analyses filters", () => {
  it("lists distinct years newest first", () => {
    expect(listAnalysesYears(posts)).toEqual(["2026", "2025"]);
  });

  it("filters by panel and year, newest first by default", () => {
    const result = filterAnalyses(posts, {
      panelId: "painel-agua",
      year: ALL_OPTION,
      sort: "date_DESC",
    });

    expect(result.map((post) => post.title)).toEqual(["Água", "Seca"]);
    expect(
      filterAnalyses(posts, {
        panelId: ALL_OPTION,
        year: "2026",
        sort: "title_ASC",
      }).map((post) => post.title),
    ).toEqual(["Água", "Renda"]);
  });
});
