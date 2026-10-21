import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PibMobilePanel from "./PibMobilePanel";
import { parsePibPanel, type PibPanel } from "@/features/panels/pibPanel";
import { PIB_PANEL_PAYLOAD } from "@/features/panels/pibPanelFixtures";

// Recharts' ResponsiveContainer measures its parent; jsdom has no layout engine.
class ResizeObserverFake {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

/** Stands in for /api/paineis/pib: answers every request with one panel. */
class PibPanelProxyFake {
  readonly requested: string[] = [];

  constructor(private readonly panel: PibPanel) {}

  readonly fetch = vi.fn(async (input: string): Promise<Response> => {
    this.requested.push(input);

    return Response.json(this.panel);
  });
}

const PANEL = parsePibPanel(PIB_PANEL_PAYLOAD);

const MUNICIPALITY_PANEL: PibPanel = {
  ...PANEL,
  selection: { area: "ne", uf: "PB", municipio: 2504009 },
  series: [{ ano: 2022, pibTotal: 12e9, pibPerCapita: 30_000 }],
};

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverFake);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PibMobilePanel", () => {
  it("opens on the latest year with the Power BI blocks in order", () => {
    render(<PibMobilePanel initialPanel={PANEL} />);

    expect(screen.getByLabelText("Ano")).toHaveValue("2023");
    expect(screen.getByText("PIB · 2023")).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent),
    ).toEqual([
      "Evolução anual",
      "Valor Adicionado Bruto (VAB) por setor",
      "Atividade com maior VAB",
    ]);
  });

  it("explains that VAB falls back to the latest published year", () => {
    render(<PibMobilePanel initialPanel={PANEL} />);

    expect(
      screen.getAllByText(
        "Os dados de 2023 ainda não foram disponibilizados pelo IBGE. Mostrando 2021.",
      ),
    ).toHaveLength(2);
    expect(screen.getByText("208 municípios · 29% do PIB")).toBeInTheDocument();
  });

  it("refetches through the proxy when a municipality is picked", async () => {
    const proxy = new PibPanelProxyFake(MUNICIPALITY_PANEL);
    vi.stubGlobal("fetch", proxy.fetch);
    render(<PibMobilePanel initialPanel={PANEL} />);

    await userEvent.selectOptions(
      screen.getByLabelText("Município"),
      "2504009",
    );

    expect(proxy.requested).toEqual([
      "/api/paineis/pib?area=ne&uf=PB&municipio=2504009",
    ]);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Campina Grande (PB)" }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Ano")).toHaveValue("2022");
  });

  it("clears the municipality when the state changes", async () => {
    const proxy = new PibPanelProxyFake(PANEL);
    vi.stubGlobal("fetch", proxy.fetch);
    render(<PibMobilePanel initialPanel={PANEL} />);

    await userEvent.selectOptions(screen.getByLabelText("Estado"), "PE");

    expect(proxy.requested).toEqual(["/api/paineis/pib?area=ne&uf=PE"]);
  });

  it("switches the trend metric", async () => {
    render(<PibMobilePanel initialPanel={PANEL} />);
    const perCapita = screen.getByRole("button", { name: "PIB per capita" });

    await userEvent.click(perCapita);

    expect(perCapita).toHaveAttribute("aria-pressed", "true");
  });
});
