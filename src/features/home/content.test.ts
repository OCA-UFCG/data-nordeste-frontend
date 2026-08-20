import { describe, expect, it } from "vitest";
import { BLOCKS } from "@contentful/rich-text-types";
import {
  findHomeSection,
  getFilteredPreviewCards,
  getPreviewStates,
  normalizePreviewCards,
} from "./content";
import {
  IPreviewCards,
  IStateData,
  MacroTheme,
  SectionHeader,
} from "@/utils/interfaces";

type RawState = IStateData & { icon_svg?: { url: string } };
type RawPreviewCard = Omit<IPreviewCards, "jsonFile"> & {
  iconsvg?: { url: string };
  jsonFile: Omit<IPreviewCards["jsonFile"], "states"> & { states: RawState[] };
};

const category: MacroTheme = {
  name: "Saúde",
  id: "saude",
  color: "#018F39",
  sys: {
    id: "theme-saude",
  },
  description: { json: { nodeType: BLOCKS.DOCUMENT, data: {}, content: [] } },
  article: { json: { nodeType: BLOCKS.DOCUMENT, data: {}, content: [] } },
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
] satisfies RawPreviewCard[];

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
