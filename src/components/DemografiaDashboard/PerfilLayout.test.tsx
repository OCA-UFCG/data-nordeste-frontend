import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PerfilEmptyLayout } from "@/components/DemografiaDashboard/PerfilLayout";
import type { PerfilLayoutProps } from "@/components/DemografiaDashboard/PerfilLayout";
import {
  emptyDemografiaPanel,
  DEMOGRAFIA_YEAR_RANGE,
} from "@/features/panels/demografia/demografiaPanel";
import { defaultTerritorialFilters } from "@/features/panels/territorialFilters";

// O mapa de porte tem canvas e busca a malha; o teste só precisa do layout.
vi.mock("@/components/DemografiaDashboard/PerfilPorteMapCard", () => ({
  PerfilPorteMapCard: () => null,
}));

const buildProps = (onReset: () => void): PerfilLayoutProps => ({
  data: emptyDemografiaPanel(defaultTerritorialFilters(DEMOGRAFIA_YEAR_RANGE)),
  place: "Nordeste",
  state: "ok",
  onRetry: () => undefined,
  onSelectUf: () => undefined,
  onReset,
});

describe("PerfilEmptyLayout", () => {
  it("shows one shortcut back to the default place and year", () => {
    render(<PerfilEmptyLayout {...buildProps(() => undefined)} />);

    const buttons = screen.getAllByRole("button");

    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent("Ver Nordeste");
    expect(screen.queryByRole("button", { name: "Limpar filtros" })).toBeNull();
  });

  it("calls onReset when the shortcut is clicked", () => {
    const onReset = vi.fn();
    render(<PerfilEmptyLayout {...buildProps(onReset)} />);

    fireEvent.click(screen.getByRole("button", { name: /Ver Nordeste/ }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
