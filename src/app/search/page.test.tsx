import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getSearchIndex } from "@/features/search/contentful";
import type { SearchIndex } from "@/features/search/types";

vi.mock("@/features/search/contentful", () => ({
  getSearchIndex: vi.fn(),
}));

vi.mock("@/templates/HubTemplate", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));

const index = {
  version: 1,
  generatedAt: "2026-05-28T00:00:00.000Z",
  items: [
    {
      id: "post:1",
      source: "post",
      type: "data-panel",
      title: "PIB",
      description: "Produto interno bruto",
      href: "/data-panel/pib",
      date: "2026-01-01",
      thumb: null,
      themes: ["Economia e Renda"],
      tags: ["PIB"],
      text: "pib produto interno bruto economia e renda",
    },
    {
      id: "theme:1",
      source: "theme",
      type: "theme",
      title: "Economia e Renda",
      description: "Panorama econômico",
      href: "/macrothemes/economia-e-renda",
      date: null,
      thumb: null,
      themes: ["Economia e Renda"],
      tags: ["PIB"],
      text: "economia e renda pib panorama economico",
    },
  ],
} satisfies SearchIndex;

describe("Search page", () => {
  it("does not load the index for short queries", async () => {
    const { default: SearchPage } = await import("./page");

    render(await SearchPage({ searchParams: Promise.resolve({ q: "p" }) }));

    expect(getSearchIndex).not.toHaveBeenCalled();
    expect(
      screen.getByText("Digite ao menos 2 caracteres para buscar."),
    ).toBeInTheDocument();
  });

  it("renders grouped search results", async () => {
    vi.mocked(getSearchIndex).mockResolvedValue(index);
    const { default: SearchPage } = await import("./page");

    render(await SearchPage({ searchParams: Promise.resolve({ q: "pib" }) }));

    expect(screen.getByRole("heading", { name: "Busca" })).toBeInTheDocument();
    expect(screen.getByText("Painéis")).toBeInTheDocument();
    expect(screen.getByText("Macrotemas")).toBeInTheDocument();
    expect(screen.getByText("PIB")).toBeInTheDocument();
    expect(screen.getAllByText("Economia e Renda").length).toBeGreaterThan(0);
  });
});
