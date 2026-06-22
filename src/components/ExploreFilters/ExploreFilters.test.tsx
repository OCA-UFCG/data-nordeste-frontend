import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ExploreFilters } from "./ExploreFilters";

vi.mock("next/navigation", () => ({
  usePathname: () => "/catalog",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
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
  it("reveals theme filters from the mobile button", async () => {
    render(
      <ExploreFilters
        themes={themes}
        mobileCatalogLayout
        showClearFilters={false}
        showSorting={false}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Veja por temas" });
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
});
