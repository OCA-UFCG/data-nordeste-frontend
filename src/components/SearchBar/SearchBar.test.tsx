import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SearchBar } from "./SearchBar";
import type { SearchIndex } from "@/features/search/types";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
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
  ],
} satisfies SearchIndex;

describe("SearchBar", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    push.mockReset();
  });

  it("loads the public index, shows suggestions, and submits to /search", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(index)),
    );

    render(<SearchBar />);

    const input = screen.getByRole("searchbox", { name: "Buscar conteúdo" });
    await userEvent.click(input);
    await userEvent.type(input, "pib");

    expect(await screen.findByText("PIB")).toBeInTheDocument();
    expect(screen.getByText("Produto interno bruto")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/search-index.json");

    await userEvent.keyboard("{Enter}");

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/search?q=pib");
    });
  });
});
