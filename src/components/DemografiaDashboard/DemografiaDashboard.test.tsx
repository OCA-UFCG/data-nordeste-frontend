import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DemografiaDashboard } from "@/components/DemografiaDashboard/DemografiaDashboard";
import { stubPanelBrowserApis } from "@/components/ProtoPanel/protoBrowserFakes";
import { emptyDemografiaPanel } from "@/features/panels/demografia/demografiaPanel";
import { NO_DEMOGRAFIA_YEARS } from "@/features/panels/demografia/demografiaYearRange";
import { parseTerritorialFilters } from "@/features/panels/territorialFilters";

vi.mock("@/components/Panel/filters/useTerritorialNavigation", () => ({
  usePanelNavigation: () => ({
    isPending: false,
    pathname: "/demo/perfil-demografico",
    applyFilters: () => undefined,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {} }),
  usePathname: () => "/demo/perfil-demografico",
}));

describe("DemografiaDashboard", () => {
  beforeEach(() => {
    stubPanelBrowserApis();
  });

  // Regressão (revisão da PR #411): sem os anos do banco, o painel mostrava
  // "Nordeste · 0" no resumo e nos subtítulos.
  it("shows the error state without a year when the years query failed", () => {
    const filters = parseTerritorialFilters({}, NO_DEMOGRAFIA_YEARS, 100);

    render(
      <DemografiaDashboard
        data={emptyDemografiaPanel(filters)}
        years={NO_DEMOGRAFIA_YEARS}
        failed
        catalogHref={null}
      />,
    );

    expect(
      screen.getAllByRole("button", { name: "Tentar de novo" }).length,
    ).toBeGreaterThan(0);
    expect(document.body.textContent).not.toMatch(/·\s*0(?!\d)/);
    expect(
      screen.queryAllByRole("option", { name: "0", hidden: true }),
    ).toEqual([]);
  });
});
