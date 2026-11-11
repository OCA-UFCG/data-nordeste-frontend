import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getContent } from "@/utils/contentful";
import MacroThemePage from "./page";

vi.mock("@/utils/contentful", () => ({
  getContent: vi.fn(),
}));

vi.mock("@/templates/HubTemplate", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));

vi.mock("@/components/MacroThemeBanner/MacroThemeBanner", () => ({
  MacroThemeBanner: () => null,
}));

vi.mock("@/components/MacroThemeTabs/MacroThemeTabs", () => ({
  MacroThemeTabs: ({ showAnalysesTab }: { showAnalysesTab?: boolean }) => (
    <section>showAnalysesTab: {String(showAnalysesTab)}</section>
  ),
}));

const macroThemePageContent = (themeId: string) => ({
  themeCollection: {
    items: [
      { id: themeId, name: themeId, sys: { id: "4zH3uAR5aJqcwRPxVqBg9a" } },
    ],
  },
  postCollection: { items: [] },
  previewCardsCollection: { items: [] },
  sectionHeadCollection: { items: [] },
  pageHeadersCollection: { items: [] },
});

const renderMacroThemePage = async (slug: string) => {
  vi.mocked(getContent).mockResolvedValue(macroThemePageContent(slug));
  render(await MacroThemePage({ params: Promise.resolve({ slug }) }));
};

describe("MacroThemePage", () => {
  // Regression: the page passed the random Contentful `sys.id` to
  // hasAnalysesTab, so Cultura kept showing the Análises tab.
  it("hides the Análises tab on Cultura by the theme's editorial id", async () => {
    await renderMacroThemePage("cultura");

    expect(screen.getByText("showAnalysesTab: false")).toBeInTheDocument();
  });

  it("keeps the Análises tab on other macrothemes", async () => {
    await renderMacroThemePage("saude");

    expect(screen.getByText("showAnalysesTab: true")).toBeInTheDocument();
  });
});
