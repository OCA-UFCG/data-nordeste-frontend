import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AridezMapCard } from "@/components/AridezDashboard/AridezMapCard";
import { ARIDEZ_CARD_SOURCE } from "@/components/AridezDashboard/aridezTexts";
import type { PanelMapProps } from "@/components/PanelMap/PanelMap";
import {
  ProtoCardMenuContext,
  type ProtoCardMenuContextValue,
} from "@/components/ProtoPanel/ProtoCardMenu";
import type { ProtoCardState } from "@/components/ProtoPanel/ProtoCard";
import type { MapRecorte } from "@/features/panelMap/mapRecorte";
import { territorialToRecorte } from "@/features/panelMap/panelMapAdapters";
import { formatSharePercent } from "@/features/panels/aridez/aridezFormat";
import type { AridezPanelData } from "@/features/panels/aridez/aridezPanel";
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
  ano: 2021,
  area: "semiarido",
  uf: ["PB"],
};

const town = (
  cdMun: string,
  arido: number,
  semiarido: number,
  subumido: number,
  umido: number,
) => ({ cdMun, nome: cdMun, areas: { arido, semiarido, subumido, umido } });

// A: 40% ASD, predomina o úmido. B: 100% ASD, predomina o semiárido.
// C: 100% ASD, predomina o semiárido. D: sem área classificada fica de fora.
const MAPA = [
  town("A", 10, 20, 10, 60),
  town("B", 0, 80, 20, 0),
  town("C", 0, 70, 30, 0),
];

const DATA: AridezPanelData = {
  filters: SELECTION,
  ufs: [],
  municipios: [],
  areas: null,
  baseAreas: null,
  porMunicipio: [MAPA[0]],
  mapa: MAPA,
};

const MENU: ProtoCardMenuContextValue = {
  share: { path: "/demo/aridez", chips: [] },
  catalogHref: null,
  imageSource: ARIDEZ_CARD_SOURCE,
};

const lastProps = (): PanelMapProps =>
  panelMapRenders[panelMapRenders.length - 1];

const ui = (
  onFiltersChange: (filters: TerritorialFilters) => void = vi.fn(),
  state: ProtoCardState = "ok",
  data: AridezPanelData = DATA,
  selection: TerritorialFilters = SELECTION,
) => (
  <ProtoCardMenuContext.Provider value={MENU}>
    <AridezMapCard
      data={data}
      selection={selection}
      onFiltersChange={onFiltersChange}
      state={state}
      onRetry={vi.fn()}
    />
  </ProtoCardMenuContext.Provider>
);

const emit = (recorte: MapRecorte) =>
  act(() => lastProps().onRecorteChange(recorte));

describe("AridezMapCard", () => {
  beforeEach(() => {
    panelMapRenders.length = 0;
    vi.stubGlobal("matchMedia", DESKTOP_MEDIA);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("renders the municipal aridez map for the requested area, year and selection", () => {
    render(ui());

    expect(lastProps()).toMatchObject({
      indicator: "aridez",
      ano: 2021,
      area: "semiarido",
      deepest: "municipio",
      label: "Índice de aridez por município",
      formatValue: formatSharePercent,
      valueLabel: "Área suscetível",
    });
    expect(lastProps().recorte).toEqual({ uf: ["PB"], mun: [] });
  });

  it("gives the map the ASD share of every municipality of the area", () => {
    render(ui());

    const values = lastProps().values;

    expect([...(values?.keys() ?? [])]).toEqual(["A", "B", "C"]);
    expect(values?.get("A")).toBeCloseTo(40);
    expect(values?.get("B")).toBe(100);
  });

  it("counts the municipalities by predominant class, keyed by the numeric code", () => {
    render(ui());

    const counts = lastProps().classCounts;

    expect(counts?.get(5)).toBe(1);
    expect(counts?.get(3)).toBe(2);
    expect(counts?.get(2)).toBeUndefined();
  });

  it("keeps values and class counts as the same objects while the data does not change", () => {
    const { rerender } = render(ui());
    const { values, classCounts } = lastProps();

    rerender(ui(vi.fn(), "ok", DATA, { ...SELECTION, uf: ["PE"] }));

    expect(lastProps().recorte).toEqual({ uf: ["PE"], mun: [] });
    expect(lastProps().values).toBe(values);
    expect(lastProps().classCounts).toBe(classCounts);
  });

  it("recomputes them when the map data changes", () => {
    const { rerender } = render(ui());
    const { values } = lastProps();

    rerender(ui(vi.fn(), "ok", { ...DATA, mapa: [MAPA[1]] }));

    expect(lastProps().values).not.toBe(values);
    expect([...(lastProps().values?.keys() ?? [])]).toEqual(["B"]);
  });

  it("titles the card and describes the class, area and year in the subtitle", () => {
    render(ui());

    // O título tem versão curta para o celular, no mesmo cabeçalho.
    expect(
      screen.getByRole("heading", { name: /^Índice de aridez por município/ }),
    ).toHaveTextContent("Aridez por município");
    expect(
      screen.getByText(/^Classe de aridez · .+ · 2021$/),
    ).toBeInTheDocument();
  });

  it("takes the year of the subtitle from the requested selection, not from the loaded data", () => {
    render(ui(vi.fn(), "stale", DATA, { ...SELECTION, ano: 2011 }));

    expect(screen.getByText(/^Classe de aridez · .+ · 2011$/)).toBeTruthy();
    expect(lastProps().ano).toBe(2011);
  });

  it("keeps the map mounted, dimmed, while the year or the area loads", () => {
    render(ui(vi.fn(), "stale"));

    expect(screen.getByTestId("panel-map")).toBeInTheDocument();
  });

  it("swaps the map for the skeleton while loading and for the retry notice on error", () => {
    const { rerender } = render(ui(vi.fn(), "loading"));

    expect(screen.queryByTestId("panel-map")).toBeNull();
    rerender(ui(vi.fn(), "error"));
    expect(screen.queryByTestId("panel-map")).toBeNull();
    expect(screen.getByRole("button", { name: /Tentar de novo/ })).toBeTruthy();
  });

  it("turns a state zoom into the panel filters, dropping empty municipalities", () => {
    const onFiltersChange = vi.fn();

    render(ui(onFiltersChange));
    emit({ uf: ["PE"], mun: [] });

    expect(onFiltersChange).toHaveBeenCalledWith({
      ano: 2021,
      area: "semiarido",
      uf: ["PE"],
      mun: undefined,
    });
  });

  // IMPORTANT: se o recorte devolvido pelo painel for igual ao que o mapa
  // emitiu, o PanelMap centra uma vez só; diferente, enquadraria de novo.
  it("sends filters whose recorte equals the one the map emitted", () => {
    const onFiltersChange = vi.fn<(filters: TerritorialFilters) => void>();
    const emitted: MapRecorte = { uf: ["PE"], mun: ["2611606"] };

    render(ui(onFiltersChange));
    emit(emitted);

    const [requested] = onFiltersChange.mock.calls[0];

    expect(territorialToRecorte(requested)).toEqual(emitted);
  });

  it("opens a second municipal map in the fullscreen dialog wired to the same filters and data", () => {
    const onFiltersChange = vi.fn();

    render(ui(onFiltersChange));
    fireEvent.click(
      screen.getByRole("button", { name: "Abrir mapa em tela cheia" }),
    );

    expect(screen.getAllByTestId("panel-map")).toHaveLength(2);
    expect(lastProps().indicator).toBe("aridez");
    expect(lastProps().classCounts?.get(3)).toBe(2);
    emit({ uf: ["CE"], mun: [] });
    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ uf: ["CE"] }),
    );
    expect(screen.getByText(/Aproxime o mapa ou clique/)).toBeTruthy();
  });

  async function downloadImage() {
    fireEvent.click(
      screen.getByRole("button", {
        name: "Mais opções: Índice de aridez por município",
      }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Baixar imagem" }),
    );
  }

  it("credits the OpenStreetMap basemap in the downloaded image source", async () => {
    render(ui());
    await downloadImage();

    expect(
      await screen.findByText(
        `${ARIDEZ_CARD_SOURCE} · Basemap: © OpenStreetMap contributors`,
      ),
    ).toBeInTheDocument();
  });

  it("credits Esri once the satellite basemap is chosen", async () => {
    render(ui());
    act(() => lastProps().onBasemapChange?.("satelite"));
    await downloadImage();

    expect(
      await screen.findByText(
        `${ARIDEZ_CARD_SOURCE} · Basemap: Esri, Maxar, Earthstar Geographics`,
      ),
    ).toBeInTheDocument();
  });
});
