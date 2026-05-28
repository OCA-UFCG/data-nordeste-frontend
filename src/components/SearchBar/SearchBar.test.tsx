import { StrictMode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SearchBar } from "./SearchBar";
import { resetSearchIndexCache } from "@/features/search/clientIndex";
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
    resetSearchIndexCache();
    vi.unstubAllGlobals();
    vi.useRealTimers();
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

  it("keeps suggestions open when focus moves within the form", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(index)),
    );

    render(<SearchBar />);

    const input = screen.getByRole("searchbox", { name: "Buscar conteúdo" });
    await userEvent.click(input);
    await userEvent.type(input, "pib");

    expect(await screen.findByText("PIB")).toBeInTheDocument();

    vi.useFakeTimers();
    const button = screen.getByRole("button", { name: "Buscar" });

    fireEvent.blur(input, { relatedTarget: button });
    button.focus();
    vi.advanceTimersByTime(200);

    expect(button).toHaveFocus();
    expect(screen.getByText("Ver todos os resultados")).toBeInTheDocument();
  });

  it("syncs the input value when initialQuery changes", () => {
    const { rerender } = render(
      <SearchBar initialQuery="pib" variant="page" />,
    );

    expect(
      screen.getByRole("searchbox", { name: "Buscar conteúdo" }),
    ).toHaveValue("pib");

    rerender(<SearchBar initialQuery="agua" variant="page" />);

    expect(
      screen.getByRole("searchbox", { name: "Buscar conteúdo" }),
    ).toHaveValue("agua");
  });

  it("reuses the loaded index across remounts", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(index))
      .mockRejectedValueOnce(new Error("temporary failure"));

    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = render(<SearchBar />);

    const firstInput = screen.getByRole("searchbox", {
      name: "Buscar conteúdo",
    });
    await userEvent.click(firstInput);
    await userEvent.type(firstInput, "pib");

    expect(await screen.findByText("PIB")).toBeInTheDocument();

    unmount();

    render(<SearchBar />);

    const secondInput = screen.getByRole("searchbox", {
      name: "Buscar conteúdo",
    });
    await userEvent.click(secondInput);
    await userEvent.type(secondInput, "pib");

    expect(screen.getByText("PIB")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("loads suggestions in StrictMode without getting stuck in loading", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(index)),
    );

    render(
      <StrictMode>
        <SearchBar />
      </StrictMode>,
    );

    const input = screen.getByRole("searchbox", { name: "Buscar conteúdo" });
    await userEvent.click(input);
    await userEvent.type(input, "pib");

    expect(await screen.findByText("PIB")).toBeInTheDocument();
    expect(screen.queryByText("Carregando resultados")).not.toBeInTheDocument();
  });
});
