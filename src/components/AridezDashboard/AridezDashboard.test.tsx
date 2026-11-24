import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AridezDashboard } from "@/components/AridezDashboard/AridezDashboard";
import { aridezBigNumbers } from "@/components/AridezDashboard/AridezBigNumbers";
import type { PanelMapProps } from "@/components/PanelMap/PanelMap";
import { stubPanelBrowserApis } from "@/components/ProtoPanel/protoBrowserFakes";
import {
  emptyAridezPanel,
  type AridezPanelData,
} from "@/features/panels/aridez/aridezPanel";

const replace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => "/demo/aridez",
  useRouter: () => ({ push: vi.fn(), replace }),
  useSearchParams: () => new URLSearchParams(),
}));

// O mapa é MapLibre (canvas); o dublê só guarda as props da última montagem.
const panelMapRenders = vi.hoisted(() => [] as PanelMapProps[]);

vi.mock("@/components/PanelMap/PanelMap", () => ({
  PanelMap: (props: PanelMapProps) => {
    panelMapRenders.push(props);

    return <div data-testid="panel-map" />;
  },
}));

const AREAS = { arido: 0, semiarido: 650, subumido: 0, umido: 350 };

const PANEL: AridezPanelData = {
  filters: { ano: 2021, area: "nordeste" },
  ufs: [{ sigla: "PE", nome: "Pernambuco" }],
  municipios: [{ cdMun: "2611101", nome: "Petrolina (PE)" }],
  areas: AREAS,
  baseAreas: AREAS,
  porMunicipio: [{ cdMun: "2611101", nome: "Petrolina (PE)", areas: AREAS }],
  mapa: [{ cdMun: "2611101", nome: "Petrolina (PE)", areas: AREAS }],
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
  beforeEach(() => {
    stubPanelBrowserApis();
    panelMapRenders.length = 0;
    replace.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("draws the shared municipal map with the aridez raster, fed by the whole-area data", () => {
    render(<AridezDashboard data={PANEL} catalogHref="/catalog" />);

    const [props] = panelMapRenders;

    expect(screen.getAllByTestId("panel-map")).toHaveLength(1);
    expect(props).toMatchObject({
      indicator: "aridez",
      deepest: "municipio",
      ano: 2021,
      area: "nordeste",
    });
    expect(props.values?.get("2611101")).toBe(65);
    expect(props.classCounts?.get(3)).toBe(1);
  });

  it("sends the map zoom through the same request as the filter bar", () => {
    render(<AridezDashboard data={PANEL} catalogHref="/catalog" />);

    act(() =>
      panelMapRenders[panelMapRenders.length - 1].onRecorteChange({
        uf: ["PE"],
        mun: [],
      }),
    );

    expect(replace).toHaveBeenCalledWith(
      expect.stringContaining("uf=PE"),
      expect.anything(),
    );
  });

  it("keeps the same map mounted, with no skeleton, when the year changes", () => {
    render(<AridezDashboard data={PANEL} catalogHref="/catalog" />);
    const mounted = screen.getByTestId("panel-map");

    fireEvent.change(screen.getByLabelText("Ano"), {
      target: { value: "2011" },
    });

    expect(replace).toHaveBeenCalledWith(
      expect.stringContaining("ano=2011"),
      expect.anything(),
    );
    expect(screen.getByTestId("panel-map")).toBe(mounted);

    // O pedido chega ao mapa na hora (seleção otimista), sem esqueleto.
    expect(panelMapRenders.some(({ ano }) => ano === 2011)).toBe(true);
    expect(screen.queryByLabelText("Carregando")).toBeNull();
  });

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
