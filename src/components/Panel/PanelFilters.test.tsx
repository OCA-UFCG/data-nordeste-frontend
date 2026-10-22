import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PanelFilters } from "@/components/Panel/PanelFilters";

const renderFilters = (onClear = vi.fn()) =>
  render(
    <PanelFilters summary="Pernambuco · 2021" onClear={onClear}>
      <label>
        Ano
        <select defaultValue="2021">
          <option>2021</option>
        </select>
      </label>
    </PanelFilters>,
  );

describe("PanelFilters", () => {
  it("clears from the mobile button", () => {
    const onClear = vi.fn();

    renderFilters(onClear);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Limpar filtros" })[0],
    );

    expect(onClear).toHaveBeenCalledOnce();
  });

  it("opens the drawer with the current selection", () => {
    renderFilters();
    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));

    expect(screen.getByRole("dialog", { name: "Filtros" })).toBeInTheDocument();
    expect(
      screen.getByText("Mostrando: Pernambuco · 2021"),
    ).toBeInTheDocument();
  });
});
