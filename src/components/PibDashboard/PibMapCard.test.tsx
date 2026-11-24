import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PibMapCard } from "@/components/PibDashboard/PibMapCard";
import { stubPanelBrowserApis } from "@/components/ProtoPanel/protoBrowserFakes";
import {
  emptyPibPanel,
  type PibPanelData,
} from "@/features/panels/pib/pibPanel";

// A malha não importa aqui: o teste lê o card e a tabela escondida.
class MunicipalMeshFetchFake {
  readonly urls: string[] = [];

  readonly fetch = async (url: string) => {
    this.urls.push(url);

    return new Response(JSON.stringify({ features: [] }));
  };
}

const PANEL: PibPanelData = {
  ...emptyPibPanel({ ano: 2023, area: "nordeste" }),
  mapa: [
    { code: "2504009", name: "Campina Grande", uf: "PB", value: 11.3e9 },
    { code: "2611606", name: "Recife", uf: "PE", value: 66.35e9 },
  ],
};

const renderCard = () =>
  render(
    <PibMapCard
      data={PANEL}
      place="Nordeste"
      selectedMuns={[]}
      state="ok"
      onRetry={() => {}}
    />,
  );

describe("PibMapCard", () => {
  let mesh: MunicipalMeshFetchFake;

  beforeEach(() => {
    stubPanelBrowserApis();
    mesh = new MunicipalMeshFetchFake();
    vi.stubGlobal("fetch", mesh.fetch);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("titles the card as the municipal PIB map, with place and year", () => {
    renderCard();

    expect(
      screen.getByRole("heading", { name: "PIB total por município" }),
    ).toBeTruthy();
    expect(
      screen.getByText("PIB total por município · Nordeste · 2023"),
    ).toBeTruthy();
    expect(screen.queryByText(/por estado/)).toBeNull();
  });

  it("draws the municipal mesh and lists each municipality for screen readers", () => {
    renderCard();

    expect(mesh.urls).toEqual(["/maps/municipios-sudene.json"]);
    expect(
      screen.getByRole("row", { name: /Recife \(PE\) R\$ 66,35 Bi/ }),
    ).toBeTruthy();
  });
});
