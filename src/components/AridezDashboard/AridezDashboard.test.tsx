import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AridezDashboard } from "@/components/AridezDashboard/AridezDashboard";
import { aridezBigNumbers } from "@/components/AridezDashboard/AridezBigNumbers";
import { stubPanelBrowserApis } from "@/components/ProtoPanel/protoBrowserFakes";
import {
  emptyAridezPanel,
  type AridezPanelData,
} from "@/features/panels/aridez/aridezPanel";

vi.mock("next/navigation", () => ({
  usePathname: () => "/demo/aridez",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const AREAS = { arido: 0, semiarido: 650, subumido: 0, umido: 350 };

const PANEL: AridezPanelData = {
  filters: { ano: 2021, area: "nordeste" },
  ufs: [{ sigla: "PE", nome: "Pernambuco" }],
  municipios: [{ cdMun: "2611101", nome: "Petrolina (PE)" }],
  areas: AREAS,
  baseAreas: AREAS,
  estados: [{ code: "PE", name: "Pernambuco", areas: AREAS, value: 65 }],
  porMunicipio: [{ cdMun: "2611101", nome: "Petrolina (PE)", areas: AREAS }],
};

describe("aridezBigNumbers", () => {
  it("shows the ASD in\u00a0km² and in % of the classified area", () => {
    const [km2, pct] = aridezBigNumbers(PANEL);

    expect(km2.value).toBe("650\u00a0km²");
    expect(pct.value).toBe("65%");
    expect(pct.caption).toBe("da área classificada · Nordeste · 2021");
  });

  it("leaves the values empty without classified area", () => {
    const cells = aridezBigNumbers(emptyAridezPanel(PANEL.filters));

    expect(cells.map(({ value }) => value)).toEqual([null, null]);
  });
});

describe("AridezDashboard", () => {
  beforeEach(stubPanelBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("shows the panel brand in the desktop filter bar", () => {
    render(<AridezDashboard data={PANEL} catalogHref="/catalog" />);

    const inBar = screen
      .getAllByText("Índice de Aridez")
      .filter((node) => !node.closest("button"));

    expect(inBar).toHaveLength(1);
  });

  it("renders the Veja mais bar and the municipal breakdown", () => {
    render(<AridezDashboard data={PANEL} catalogHref="/catalog" />);

    expect(screen.getByRole("button", { name: /Veja mais/ })).toBeTruthy();
    const list = screen.getByRole("list", { name: "Municípios" });

    expect(
      within(list).getByLabelText(
        "Petrolina (PE): Semiárido 65,00%, Úmido 35,00%",
      ),
    ).toBeTruthy();
  });

  it("shows the no-data notice instead of the cards", () => {
    render(
      <AridezDashboard
        data={{ ...PANEL, areas: null, porMunicipio: [] }}
        catalogHref="/catalog"
      />,
    );

    expect(screen.getByText(/não há dados para/)).toBeTruthy();
    expect(screen.queryByRole("list", { name: "Municípios" })).toBeNull();
  });
});
