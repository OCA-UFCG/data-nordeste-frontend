import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PerfilPorteMapCard,
  type PorteMapView,
} from "@/components/DemografiaDashboard/PerfilPorteMapCard";
import { PERFIL_CARD_SOURCE } from "@/components/DemografiaDashboard/perfilTexts";
import type { PanelMapProps } from "@/components/PanelMap/PanelMap";
import {
  ProtoCardMenuContext,
  type ProtoCardMenuContextValue,
} from "@/components/ProtoPanel/ProtoCardMenu";
import type { MapRecorte } from "@/features/panelMap/mapRecorte";
import { territorialToRecorte } from "@/features/panelMap/panelMapAdapters";
import {
  emptyDemografiaPanel,
  type DemografiaPanelData,
} from "@/features/panels/demografia/demografiaPanel";
import { formatPessoas } from "@/features/panels/format";
import type { TerritorialFilters } from "@/features/panels/territorialFilters";

// O mapa é MapLibre (canvas); o dublê só guarda as props de cada montagem.
const panelMapRenders = vi.hoisted(() => [] as PanelMapProps[]);

vi.mock("@/components/PanelMap/PanelMap", () => ({
  PanelMap: (props: PanelMapProps) => {
    panelMapRenders.push(props);

    return <div data-testid="panel-map" aria-label={props.label} />;
  },
}));

// O jsdom não tem matchMedia; o menu pergunta se a tela é de celular.
const DESKTOP_MEDIA = (query: string) => ({
  matches: false,
  media: query,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
});

const SELECTION: TerritorialFilters = {
  ano: 2022,
  area: "semiarido",
  uf: ["PB"],
};

const MENU: ProtoCardMenuContextValue = {
  share: { path: "/demo/perfil-demografico", chips: [] },
  catalogHref: null,
  imageSource: PERFIL_CARD_SOURCE,
};

const PANEL: DemografiaPanelData = {
  ...emptyDemografiaPanel(SELECTION),
  mapa: [
    { code: "2504009", name: "Campina Grande", uf: "PB", value: 419379 },
    { code: "2507507", name: "João Pessoa", uf: "PB", value: 833932 },
  ],
};

const lastProps = (): PanelMapProps =>
  panelMapRenders[panelMapRenders.length - 1];

const CLOSED: PorteMapView = {
  view: "municipios",
  setView: vi.fn(),
  fullscreen: false,
  setFullscreen: vi.fn(),
};

const renderCard = (
  onFiltersChange: (filters: TerritorialFilters) => void = vi.fn(),
  mapView: PorteMapView = CLOSED,
) =>
  render(
    <ProtoCardMenuContext.Provider value={MENU}>
      <PerfilPorteMapCard
        data={PANEL}
        place="Semiárido"
        selection={SELECTION}
        onFiltersChange={onFiltersChange}
        mapView={mapView}
        state="ok"
        onRetry={vi.fn()}
      />
    </ProtoCardMenuContext.Provider>,
  );

const emit = (recorte: MapRecorte) =>
  act(() => lastProps().onRecorteChange(recorte));

describe("PerfilPorteMapCard", () => {
  beforeEach(() => {
    panelMapRenders.length = 0;
    vi.stubGlobal("matchMedia", DESKTOP_MEDIA);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("renders the municipal demografia map for the requested area, year and selection", () => {
    renderCard();

    expect(lastProps()).toMatchObject({
      indicator: "demografia",
      ano: 2022,
      area: "semiarido",
      deepest: "municipio",
      label: "Mapa dos municípios por porte",
      formatValue: formatPessoas,
      valueLabel: "População",
    });
    expect(lastProps().recorte).toEqual({ uf: ["PB"], mun: [] });
  });

  // A aridez vive só no painel dela: nem raster nem checkbox neste mapa.
  it("keeps the aridez raster and its checkbox out of the map", () => {
    renderCard();

    expect(lastProps().aridez ?? "off").toBe("off");
    expect(screen.queryByRole("checkbox", { name: /aridez/i })).toBeNull();
  });

  it("titles the card and describes place and year in the subtitle", () => {
    renderCard();

    expect(
      screen.getByRole("heading", { name: "Porte populacional" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Semiárido · 2022")).toBeInTheDocument();
  });

  it("turns a state zoom into the panel filters, dropping empty municipalities", () => {
    const onFiltersChange = vi.fn();

    renderCard(onFiltersChange);
    emit({ uf: ["PE"], mun: [] });

    expect(onFiltersChange).toHaveBeenCalledWith({
      ano: 2022,
      area: "semiarido",
      uf: ["PE"],
      mun: undefined,
    });
  });

  // IMPORTANT: se o recorte devolvido pelo painel for igual ao que o mapa
  // emitiu, o PanelMap enquadra uma vez só; diferente, enquadraria de novo.
  it("sends filters whose recorte equals the one the map emitted", () => {
    const onFiltersChange = vi.fn<(filters: TerritorialFilters) => void>();
    const emitted: MapRecorte = { uf: ["PE"], mun: ["2611606"] };

    renderCard(onFiltersChange);
    emit(emitted);

    const [requested] = onFiltersChange.mock.calls[0];

    expect(territorialToRecorte(requested)).toEqual(emitted);
  });

  it("opens a second municipal map in the fullscreen dialog wired to the same filters", () => {
    const onFiltersChange = vi.fn();

    renderCard(onFiltersChange, { ...CLOSED, fullscreen: true });

    expect(screen.getAllByTestId("panel-map")).toHaveLength(2);
    emit({ uf: ["CE"], mun: [] });
    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ uf: ["CE"] }),
    );
  });

  it("asks the dashboard to open the fullscreen map", () => {
    const setFullscreen = vi.fn();

    renderCard(vi.fn(), { ...CLOSED, setFullscreen });
    fireEvent.click(
      screen.getByRole("button", { name: "Abrir mapa em tela cheia" }),
    );

    expect(setFullscreen).toHaveBeenCalledWith(true);
  });

  it("shows the Municípios | Estados switch with the current view pressed", () => {
    renderCard();
    const group = screen.getByRole("group", { name: "Mostrar no mapa" });

    expect(
      within(group).getByRole("button", { name: "Municípios" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(group).getByRole("button", { name: "Estados" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("asks the dashboard to switch the view", () => {
    const setView = vi.fn();

    renderCard(vi.fn(), { ...CLOSED, setView });
    fireEvent.click(screen.getByRole("button", { name: "Estados" }));

    expect(setView).toHaveBeenCalledWith("estados");
  });

  it("the Estados view maps only the states and filters only the UF", () => {
    renderCard(vi.fn(), { ...CLOSED, view: "estados" });

    expect(lastProps()).toMatchObject({
      indicator: "demografia",
      featureLevel: "estado",
      deepest: "estado",
      label: "Mapa dos estados do Nordeste",
      area: "semiarido",
    });
    expect(lastProps().recorte).toEqual({ uf: ["PB"], mun: [] });
  });

  it("the Municípios view maps the municipalities", () => {
    renderCard();

    expect(lastProps().featureLevel).toBe("municipio");
  });

  it("the fullscreen map follows the chosen view", () => {
    renderCard(vi.fn(), { ...CLOSED, view: "estados", fullscreen: true });

    const maps = screen.getAllByTestId("panel-map");

    expect(maps.map((map) => map.getAttribute("aria-label"))).toEqual([
      "Mapa dos estados do Nordeste",
      "Mapa dos estados do Nordeste",
    ]);
    expect(panelMapRenders.every((props) => props.deepest === "estado")).toBe(
      true,
    );
  });

  it("drops the sr-only porte table in the Estados view", () => {
    renderCard(vi.fn(), { ...CLOSED, view: "estados" });

    expect(
      screen.queryByRole("table", { name: "Porte populacional em 2022" }),
    ).toBeNull();
  });

  it("keeps the accessible sr-only table in the card", () => {
    renderCard();

    expect(
      screen.getByRole("table", { name: "Porte populacional em 2022" }),
    ).toBeInTheDocument();
    expect(screen.getByText("João Pessoa (PB)")).toBeInTheDocument();
  });

  it("credits the OpenStreetMap basemap in the downloaded image source", async () => {
    renderCard();
    fireEvent.click(
      screen.getByRole("button", { name: "Mais opções: Porte populacional" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Baixar imagem" }),
    );

    expect(
      await screen.findByText(
        `${PERFIL_CARD_SOURCE} · Basemap: © OpenStreetMap contributors`,
      ),
    ).toBeInTheDocument();
  });
});
