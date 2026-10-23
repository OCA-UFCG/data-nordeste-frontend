import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import HeaderModal from "./HeaderModal";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/SearchBar/SearchBar", () => ({
  SearchBar: () => null,
}));

describe("HeaderModal", () => {
  it("reaches the menu trigger with Tab before the logo", async () => {
    render(<HeaderModal content={[]} />);

    await userEvent.tab();

    expect(
      screen.getByRole("button", { name: "Abrir menu de navegação" }),
    ).toHaveFocus();
    expect(
      screen.getByRole("link", { name: "Data Nordeste, página inicial" }),
    ).toBeInTheDocument();
  });

  it("returns focus to the menu trigger when the sheet closes with Escape", async () => {
    render(<HeaderModal content={[]} />);
    const trigger = screen.getByRole("button", {
      name: "Abrir menu de navegação",
    });

    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");

    expect(trigger).toHaveFocus();
  });
});
