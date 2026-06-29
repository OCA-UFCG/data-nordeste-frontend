import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExploreFilters } from "./ExploreFilters";

const searchParams = vi.hoisted(() => ({
  value: new URLSearchParams(),
}));
const replaceRoute = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => "/catalog",
  useRouter: () => ({ replace: replaceRoute }),
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
    replaceRoute.mockClear();
  });

  it("reveals theme filters from the mobile button", async () => {
    render(<ExploreFilters themes={themes} mobileCatalogLayout />);

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

  it("clears every category when all themes are selected", async () => {
    searchParams.value = new URLSearchParams(
      "category=contentful-economia&page=2",
    );
    render(<ExploreFilters themes={themes} />);

    const selectAllButton = screen.getAllByRole("button", {
      name: "Selecionar todos",
    })[0];

    expect(selectAllButton).toHaveClass("hover:bg-[#DDEADF]");
    await userEvent.click(selectAllButton);

    expect(replaceRoute).toHaveBeenCalledWith("/catalog?page=1", {
      scroll: false,
    });
  });

  it("updates explore filters locally without invoking the Next router", async () => {
    window.history.replaceState(null, "", "/catalog");
    render(<ExploreFilters themes={themes} clientSideNavigation />);

    await userEvent.click(screen.getAllByRole("checkbox")[0]);

    expect(replaceRoute).not.toHaveBeenCalled();
    expect(window.location.search).toBe("?category=contentful-economia&page=1");
  });
});
