import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PibMobilePanel from "./PibMobilePanel";
import type { PibPanel } from "@/features/panels/pibPanel";

// Recharts' ResponsiveContainer measures its parent; jsdom has no layout engine.
class ResizeObserverFake {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

const vab = (servicos: number) => ({
  agropecuaria: 1e9,
  industria: 2e9,
  servicos,
  adm_publica: 1e9,
});

const PANEL: PibPanel = {
  source: "IBGE",
  years: [2022, 2023],
  ufs: ["BA", "PB"],
  records: [
    {
      uf: "BA",
      ano: 2022,
      pibTotal: 400e9,
      pibPerCapita: 27_000,
      vab: vab(6e9),
    },
    {
      uf: "BA",
      ano: 2023,
      pibTotal: 440e9,
      pibPerCapita: 29_000,
      vab: vab(6e9),
    },
    {
      uf: "PB",
      ano: 2022,
      pibTotal: 80e9,
      pibPerCapita: 20_000,
      vab: vab(6e9),
    },
    {
      uf: "PB",
      ano: 2023,
      pibTotal: 90e9,
      pibPerCapita: 22_000,
      vab: vab(16e9),
    },
  ],
};

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverFake);
});

describe("PibMobilePanel", () => {
  it("opens on the latest year and the largest economy", () => {
    render(<PibMobilePanel panel={PANEL} />);

    expect(screen.getByLabelText("Estado")).toHaveValue("BA");
    expect(screen.getByLabelText("Ano")).toHaveValue("2023");
    expect(screen.getByText("PIB 2023")).toBeInTheDocument();
    expect(screen.getByText("+10%")).toBeInTheDocument();
  });

  it("updates the highlights and sector shares when the state changes", async () => {
    render(<PibMobilePanel panel={PANEL} />);

    await userEvent.selectOptions(screen.getByLabelText("Estado"), "PB");

    expect(screen.getByText("+12,5%")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Valor adicionado por setor · PB · 2023",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/80% ·/)).toBeInTheDocument();
  });

  it("switches the ranking metric", async () => {
    render(<PibMobilePanel panel={PANEL} />);
    const perCapita = screen.getByRole("button", { name: "PIB per capita" });

    await userEvent.click(perCapita);

    expect(perCapita).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "PIB total" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("shows the selected state's series as a table", async () => {
    render(<PibMobilePanel panel={PANEL} />);

    await userEvent.selectOptions(screen.getByLabelText("Ano"), "2022");

    expect(screen.getByText("PIB 2022")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(3);
  });
});
