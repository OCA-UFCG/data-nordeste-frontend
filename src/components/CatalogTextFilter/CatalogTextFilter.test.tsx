import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CatalogTextFilter } from "./CatalogTextFilter";

const replace = vi.fn();
const refresh = vi.fn();
let searchParams = new URLSearchParams("category=saude&page=4");

vi.mock("next/navigation", () => ({
  usePathname: () => "/catalog",
  useRouter: () => ({ refresh, replace }),
  useSearchParams: () => searchParams,
}));

describe("CatalogTextFilter", () => {
  afterEach(() => {
    replace.mockReset();
    refresh.mockReset();
    searchParams = new URLSearchParams("category=saude&page=4");
    vi.useRealTimers();
  });

  it("searches the full catalog instead of restricting by active theme", () => {
    vi.useFakeTimers();
    render(<CatalogTextFilter />);

    fireEvent.change(
      screen.getByRole("textbox", { name: "Filtrar dados do catálogo" }),
      { target: { value: "lixo" } },
    );

    expect(replace).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);

    expect(replace).toHaveBeenCalledWith("/catalog?q=lixo");
  });

  it("applies an incomplete word immediately when Enter is pressed", () => {
    vi.useFakeTimers();
    render(<CatalogTextFilter />);

    fireEvent.change(
      screen.getByRole("textbox", { name: "Filtrar dados do catálogo" }),
      { target: { value: "sanea" } },
    );
    fireEvent.submit(screen.getByRole("search"));

    expect(replace).toHaveBeenCalledOnce();
    expect(replace).toHaveBeenCalledWith("/catalog?q=sanea");

    vi.advanceTimersByTime(300);
    expect(replace).toHaveBeenCalledOnce();
  });

  it("refreshes results when Enter repeats the debounced query", () => {
    searchParams = new URLSearchParams("q=sanea");
    render(<CatalogTextFilter />);

    fireEvent.submit(screen.getByRole("search"));

    expect(replace).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledOnce();
  });
});
