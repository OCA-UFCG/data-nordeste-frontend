import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PibDashboard } from "@/components/PibDashboard/PibDashboard";
import { PIB_CARD_SOURCE } from "@/components/PibDashboard/pibTexts";
import { stubPanelBrowserApis } from "@/components/ProtoPanel/protoBrowserFakes";
import {
  emptyPibPanel,
  type PibPanelData,
} from "@/features/panels/pib/pibPanel";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/demo/pib",
  useRouter: () => ({ push: vi.fn(), replace }),
  useSearchParams: () => new URLSearchParams(),
}));

const FILTERS = { ano: 2023, area: "nordeste" } as const;

const PANEL: PibPanelData = {
  ...emptyPibPanel(FILTERS),
  serie: [
    { ano: 2022, pib: 1e9, perCapita: 1e4 },
    { ano: 2023, pib: 1.1e9, perCapita: 1.1e4 },
  ],
  vabLastYear: 2021,
};

const SECTORS = {
  vab: [{ label: "Serviços", value: 5e8 }],
  atividades: [{ label: "Demais serviços", value: 31.9 }],
};

const sectorNotices = () => screen.queryAllByText(/ainda não foram/);

const yearSelect = () => screen.getByLabelText("Ano");

describe("PibDashboard", () => {
  beforeEach(() => {
    stubPanelBrowserApis();
    replace.mockClear();
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => vi.unstubAllGlobals());

  it("shows skeletons, no empty notice and an inert filter bar while loading", () => {
    render(
      <PibDashboard
        data={emptyPibPanel(FILTERS)}
        loading
        catalogHref="/catalog"
      />,
    );

    expect(screen.getAllByLabelText("Carregando").length).toBeGreaterThan(0);
    expect(screen.queryByText(/não há dados para/)).toBeNull();
    expect(yearSelect().closest("[inert]")).not.toBeNull();
  });

  it("shows the empty notice when the series is empty and not loading", () => {
    render(
      <PibDashboard data={emptyPibPanel(FILTERS)} catalogHref="/catalog" />,
    );

    expect(screen.getByText(/não há dados para/)).toBeTruthy();
    expect(yearSelect().closest("[inert]")).toBeNull();
  });

  // A fonte fica só na seção "Fonte dos dados" do painel, não em cada card.
  it("shows no source under the charts", () => {
    render(<PibDashboard data={PANEL} catalogHref="/catalog" />);

    expect(screen.queryByText(PIB_CARD_SOURCE)).toBeNull();
  });

  it("switches to the last year with sector data and rings the year select", () => {
    render(<PibDashboard data={PANEL} catalogHref="/catalog" />);

    fireEvent.click(
      screen.getAllByRole("button", {
        name: "Ver 2021, último ano disponível",
      })[0],
    );

    expect(replace).toHaveBeenCalledWith(
      expect.stringContaining("ano=2021"),
      expect.anything(),
    );
    expect(yearSelect()).toHaveClass("animate-proto-ring");
  });

  it("sends 'Escolher outro ano' to the year select", () => {
    vi.useFakeTimers();
    render(<PibDashboard data={PANEL} catalogHref="/catalog" />);

    fireEvent.click(
      screen.getAllByRole("button", { name: "Escolher outro ano" })[0],
    );
    act(() => vi.advanceTimersByTime(250));

    expect(yearSelect().scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement).toBe(yearSelect());
    vi.useRealTimers();
  });

  it("lists the series years without VAB in the sector notice", () => {
    render(<PibDashboard data={PANEL} catalogHref="/catalog" />);

    expect(sectorNotices()[0]).toHaveTextContent(
      "Os dados para os anos de 2022 e 2023 ainda não foram disponibilizados.",
    );
  });

  it("shows the sector bars when the database has VAB for the year", () => {
    render(
      <PibDashboard
        data={{ ...PANEL, ...SECTORS, vabLastYear: 2023 }}
        catalogHref="/catalog"
      />,
    );

    expect(sectorNotices()).toHaveLength(0);
    expect(screen.getAllByText("Serviços").length).toBeGreaterThan(0);
    expect(screen.getByText(/VAB total: R\$ 500,00 Mi$/)).toBeInTheDocument();
    expect(screen.getByText(/· R\$ milhões \(Mi\)$/)).toBeInTheDocument();
    expect(screen.queryByText(/no eixo/)).not.toBeInTheDocument();
    expect(screen.getByText(/· Percentual do PIB \(%\)$/)).toBeInTheDocument();
    expect(screen.queryByText(/Participação de cada atividade/)).toBeNull();
  });

  it("shows the notice for a year without sector data, whatever the year", () => {
    render(
      <PibDashboard
        data={{
          ...PANEL,
          filters: { ano: 2015, area: "nordeste" },
          vabLastYear: 2014,
        }}
        catalogHref="/catalog"
      />,
    );

    expect(sectorNotices()).toHaveLength(2);
    expect(
      screen.getAllByRole("button", {
        name: "Ver 2014, último ano disponível",
      }),
    ).toHaveLength(2);
  });

  it("offers only the year select when the database has no VAB year", () => {
    render(
      <PibDashboard
        data={{ ...PANEL, vabLastYear: null }}
        catalogHref="/catalog"
      />,
    );

    expect(screen.queryByRole("button", { name: /^Ver \d{4}/ })).toBeNull();
    expect(
      screen.getAllByRole("button", { name: "Escolher outro ano" }),
    ).toHaveLength(2);
  });
});
