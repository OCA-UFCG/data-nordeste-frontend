import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import type { EChart } from "@/components/EChart/EChart";
import { PibMapCard } from "@/components/PibDashboard/PibMapCard";
import { stubPanelBrowserApis } from "@/components/ProtoPanel/protoBrowserFakes";
import {
  emptyPibPanel,
  type PibPanelData,
} from "@/features/panels/pib/pibPanel";

// O jsdom não desenha: o gráfico de mentira guarda o que o mapa pede a ele.
type EChartProps = ComponentProps<typeof EChart>;

const drawn: EChartProps[] = [];

vi.mock("@/components/EChart/EChart", () => ({
  EChart: (props: EChartProps) => {
    drawn.push(props);

    return null;
  },
}));

const feature = (code: string, lon: number) => ({
  properties: { name: code, uf: "PE" },
  geometry: {
    coordinates: [
      [
        [lon, -8],
        [lon + 1, -8],
        [lon + 1, -9],
        [lon, -9],
      ],
    ],
  },
});

// Malha de dois municípios; sem ela o mapa não sai do "carregando".
class MunicipalMeshFetchFake {
  readonly urls: string[] = [];

  readonly fetch = async (url: string) => {
    this.urls.push(url);

    return new Response(
      JSON.stringify({
        features: [feature("2504009", -36), feature("2611606", -35)],
      }),
    );
  };
}

const PANEL: PibPanelData = {
  ...emptyPibPanel({ ano: 2023, area: "nordeste" }),
  mapa: [
    { code: "2504009", name: "Campina Grande", uf: "PB", value: 11.3e9 },
    { code: "2611606", name: "Recife", uf: "PE", value: 66.35e9 },
  ],
};

const renderCard = (selectedMuns: string[] = []) =>
  render(
    <PibMapCard
      data={PANEL}
      place="Nordeste"
      selectedMuns={selectedMuns}
      state="ok"
      onRetry={() => {}}
    />,
  );

describe("PibMapCard", () => {
  let mesh: MunicipalMeshFetchFake;

  beforeEach(() => {
    drawn.length = 0;
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

  it("sends the chosen municipality to the canvas as the highlighted one", async () => {
    renderCard(["2611606"]);

    await waitFor(() => expect(drawn.length).toBeGreaterThan(0));
    const [series] = [drawn.at(-1)?.restyleOption?.series].flat() as {
      data: { name: string; itemStyle: { borderWidth?: number } }[];
    }[];
    const borders = Object.fromEntries(
      series.data.map((item) => [item.name, item.itemStyle.borderWidth]),
    );

    expect(borders).toEqual({ "2504009": undefined, "2611606": 3 });
  });

  it("explains the PIB terms in bold paragraphs in the info balloon", async () => {
    renderCard();

    fireEvent.click(screen.getByRole("button", { name: "Sobre este gráfico" }));
    const term = await screen.findByText("Produto Interno Bruto (PIB)");

    expect(term.tagName).toBe("B");
    expect(screen.getByText("PIB per capita").tagName).toBe("B");
    expect(
      term.closest("p")?.parentElement?.querySelectorAll("p"),
    ).toHaveLength(3);
  });
});
