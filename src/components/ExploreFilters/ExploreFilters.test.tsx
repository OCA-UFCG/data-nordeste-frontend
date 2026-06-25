import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExploreFilters } from "./ExploreFilters";

const searchParams = vi.hoisted(() => ({
  value: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/catalog",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => searchParams.value,
}));

const themes = [
  {
    id: "economia",
    name: "Economia e Renda",
    color: "#018F39",
    sys: { id: "contentful-economia" },
  },
];

describe("ExploreFilters", () => {
  afterEach(() => {
    searchParams.value = new URLSearchParams();
  });

  it("reveals theme filters from the mobile button", async () => {
    render(
      <ExploreFilters
        themes={themes}
        mobileCatalogLayout
        showClearFilters={false}
        showSorting={false}
      />,
    );

    const [trigger] = screen
      .getAllByRole("button", { name: "Veja por temas" })
      .filter((btn) => btn.hasAttribute("aria-controls"));
    const themeList = document.getElementById(
      trigger.getAttribute("aria-controls") ?? "",
    );

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(themeList).toHaveClass("max-lg:hidden");

    await userEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(themeList).not.toHaveClass("max-lg:hidden");
    expect(screen.getByText("Economia e Renda")).toBeInTheDocument();
  });

  it("fills search fields from the q URL parameter", () => {
    searchParams.value = new URLSearchParams("q=pib");

    render(<ExploreFilters themes={themes} />);

    screen
      .getAllByRole("searchbox", { name: "Buscar conteúdo" })
      .forEach((input) => expect(input).toHaveValue("pib"));
  });
});
