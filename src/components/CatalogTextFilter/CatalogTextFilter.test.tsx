import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CatalogTextFilter } from "./CatalogTextFilter";

const replace = vi.fn();
let searchParams = new URLSearchParams("category=saude&page=4");

vi.mock("next/navigation", () => ({
  usePathname: () => "/catalog",
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams,
}));

describe("CatalogTextFilter", () => {
  afterEach(() => {
    replace.mockReset();
    searchParams = new URLSearchParams("category=saude&page=4");
    vi.useRealTimers();
  });

  it("updates catalog content while preserving active filters", () => {
    vi.useFakeTimers();
    render(<CatalogTextFilter />);

    fireEvent.change(
      screen.getByRole("textbox", { name: "Filtrar dados do catálogo" }),
      { target: { value: "lixo" } },
    );

    expect(replace).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);

    expect(replace).toHaveBeenCalledWith("/catalog?category=saude&q=lixo");
  });
});
