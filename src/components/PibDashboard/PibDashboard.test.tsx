import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PibDashboard } from "@/components/PibDashboard/PibDashboard";
import { stubPanelBrowserApis } from "@/components/ProtoPanel/protoBrowserFakes";
import {
  emptyPibPanel,
  PIB_VAB_LAST_YEAR,
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
};

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

  it("switches to the last year with sector data and rings the year select", () => {
    render(<PibDashboard data={PANEL} catalogHref="/catalog" />);

    fireEvent.click(
      screen.getAllByRole("button", {
        name: `Ver ${PIB_VAB_LAST_YEAR}, último ano disponível`,
      })[0],
    );

    expect(replace).toHaveBeenCalledWith(
      expect.stringContaining(`ano=${PIB_VAB_LAST_YEAR}`),
      expect.anything(),
    );
    expect(yearSelect()).toHaveValue(String(PIB_VAB_LAST_YEAR));
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
});
