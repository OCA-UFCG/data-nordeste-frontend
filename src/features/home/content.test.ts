import { describe, expect, it } from "vitest";
import {
  findHomeSection,
  getFilteredPreviewCards,
  getPreviewStates,
  normalizePreviewCards,
} from "./content";
import { IPreviewCards, SectionHeader } from "@/utils/interfaces";

const category = {
  name: "Saúde",
  id: "saude",
  color: "#018F39",
  sys: {
    id: "theme-saude",
  },
  description: { json: {} },
  article: { json: {} },
  articleTitle: "",
  banner: { url: "" },
  tags: [],
};

const cards = [
  {
    title: "ignored title",
    category,
    iconsvg: { url: "//cdn.example.com/health.svg" },
    jsonFile: {
      region: "Nordeste",
      title: "Cobertura vacinal",
      subtitle: "2024",
      data: "85%",
      link: "/regional",
      note: "Dado regional",
      states: [
        {
          name: "Pernambuco",
          data: "91%",
          link: "/pe",
          note: "Dado estadual",
          icon_svg: { url: "/pe.svg" },
        },
      ],
    },
  },
] satisfies IPreviewCards[];

describe("home content helpers", () => {
  it("finds section headers by id", () => {
    const sections = [
      { id: "preview", title: "Indicadores", subtitle: "" },
      { id: "new", title: "Recentes", subtitle: "" },
    ] satisfies SectionHeader[];

    expect(findHomeSection(sections, "new")?.title).toBe("Recentes");
    expect(findHomeSection(sections, "missing")).toBeUndefined();
  });

  it("normalizes preview card json, states, and icon fields", () => {
    const [normalized] = normalizePreviewCards(cards);

    expect(normalized.title).toBe("Cobertura vacinal");
    expect(normalized.iconsvg?.url).toBe("//cdn.example.com/health.svg");
    expect(normalized.states[0].iconsvg?.url).toBe("/pe.svg");
    expect(getPreviewStates([normalized])).toHaveLength(1);
  });

  it("derives regional and state-specific preview cards", () => {
    const normalized = normalizePreviewCards(cards);
    const [regional] = getFilteredPreviewCards(normalized, "all");
    const [pernambuco] = getFilteredPreviewCards(normalized, "Pernambuco");

    expect(regional).toMatchObject({
      title: "Cobertura vacinal",
      data: "85%",
      link: "/regional",
      note: "Dado regional",
    });
    expect(pernambuco).toMatchObject({
      title: "Cobertura vacinal",
      data: "91%",
      link: "/pe",
      note: "Dado estadual",
      iconsvg: { url: "/pe.svg" },
    });
  });
});
