import { act, fireEvent, render, screen } from "@testing-library/react";
import type { FeatureCollection } from "geojson";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PanelMapProps } from "@/components/PanelMap/PanelMap";
import { PanelMapEngineFake } from "@/components/PanelMap/panelMapEngineFake";
import { STYLES_FIXTURE } from "@/components/PanelMap/panelMapFixtures";
import type { ReadyGeodata } from "@/components/PanelMap/useGeodata";
import { PibMapCard } from "@/components/PibDashboard/PibMapCard";
import { PIB_CARD_SOURCE } from "@/components/PibDashboard/pibTexts";
import {
  ProtoCardMenuContext,
  type ProtoCardMenuContextValue,
} from "@/components/ProtoPanel/ProtoCardMenu";
import type { MapRecorte } from "@/features/panelMap/mapRecorte";
import { territorialToRecorte } from "@/features/panelMap/panelMapAdapters";
import type { TerritorialFilters } from "@/features/panels/territorialFilters";
import { formatPibReais } from "@/features/panels/pib/pibFormat";
import type { MapPosterBase } from "@/features/panels/mapPosterBuild";
import * as chartImage from "@/lib/chartImage";

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

const MENU: ProtoCardMenuContextValue = {
  share: { path: "/demo/pib", chips: [] },
  catalogHref: null,
  imageSource: PIB_CARD_SOURCE,
};

// O que o painel (PibDashboard) dá ao cartaz de download no contexto do menu.
const POSTER_BASE: MapPosterBase = {
  panelName: "Painel de Economia e Renda",
  icon: "usd",
  accent: "#e5640f",
  updatedAt: "11/2026",
  place: "Paraíba",
  chips: [
    "Ano: 2021",
    "Área: Semiárido",
    "Estado: Paraíba",
    "Município: Todos",
  ],
};

const EMPTY: FeatureCollection = { type: "FeatureCollection", features: [] };
const GEODATA: ReadyGeodata = {
  status: "ready",
  styles: STYLES_FIXTURE,
  manifest: {
    generatedAt: "",
    years: { pib: [2021], demografia: [], idh: [] },
    aridez: {
      years: [],
      bounds: [
        [0, 0],
        [1, 1],
      ],
    },
  },
  features: EMPTY,
  states: EMPTY,
  areas: EMPTY,
};

const lastProps = (): PanelMapProps =>
  panelMapRenders[panelMapRenders.length - 1];

const renderCard = (
  onFiltersChange: (filters: TerritorialFilters) => void = vi.fn(),
  menu: ProtoCardMenuContextValue = MENU,
) =>
  render(
    <ProtoCardMenuContext.Provider value={menu}>
      <PibMapCard
        selection={SELECTION}
        onFiltersChange={onFiltersChange}
        state="ok"
        onRetry={vi.fn()}
      />
    </ProtoCardMenuContext.Provider>,
  );

const emit = (recorte: MapRecorte) =>
  act(() => lastProps().onRecorteChange(recorte));

describe("PibMapCard", () => {
  beforeEach(() => {
    panelMapRenders.length = 0;
    vi.stubGlobal("matchMedia", DESKTOP_MEDIA);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("renders the municipal PIB map for the requested area, year and selection", () => {
    renderCard();

    expect(lastProps()).toMatchObject({
      indicator: "pib",
      ano: 2021,
      area: "semiarido",
      deepest: "municipio",
      label: "Mapa do PIB por município",
      formatValue: formatPibReais,
      valueLabel: "PIB",
    });
    expect(lastProps().recorte).toEqual({ uf: ["PB"], mun: [] });
  });

  // A aridez vive só no painel dela: nem raster nem checkbox neste mapa.
  it("keeps the aridez raster and its checkbox out of the map", () => {
    renderCard();

    expect(lastProps().aridez ?? "off").toBe("off");
    expect(screen.queryByRole("checkbox", { name: /aridez/i })).toBeNull();
  });

  it("titles the card and describes area and year in the subtitle", () => {
    renderCard();

    expect(
      screen.getByRole("heading", { name: "PIB por município" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/^PIB · .+ · 2021$/)).toBeInTheDocument();
  });

  it("turns a state zoom into the panel filters, dropping empty municipalities", () => {
    const onFiltersChange = vi.fn();

    renderCard(onFiltersChange);
    emit({ uf: ["PE"], mun: [] });

    expect(onFiltersChange).toHaveBeenCalledWith({
      ano: 2021,
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

    renderCard(onFiltersChange);
    fireEvent.click(
      screen.getByRole("button", { name: "Abrir mapa em tela cheia" }),
    );

    expect(screen.getAllByTestId("panel-map")).toHaveLength(2);
    emit({ uf: ["CE"], mun: [] });
    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ uf: ["CE"] }),
    );
  });

  it("credits the OpenStreetMap basemap in the downloaded image source", async () => {
    renderCard();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Mais opções: PIB por município",
      }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Baixar imagem" }),
    );

    expect(
      await screen.findByText(
        `${PIB_CARD_SOURCE} · Basemap: © OpenStreetMap contributors`,
      ),
    ).toBeInTheDocument();
  });

  describe("poster download", () => {
    const openImageScreen = async () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: "Mais opções: PIB por município",
        }),
      );
      fireEvent.click(
        await screen.findByRole("button", { name: "Baixar imagem" }),
      );
    };
    const download = () =>
      fireEvent.click(
        screen.getAllByRole("button", { name: "Baixar imagem" }).at(-1)!,
      );
    const mountMap = () =>
      act(() => {
        lastProps().onEngine?.(new PanelMapEngineFake());
        lastProps().onGeodata?.(GEODATA);
      });

    it("downloads the poster with the panel base and the card input", async () => {
      const spy = vi
        .spyOn(chartImage, "downloadChartImage")
        .mockResolvedValue();

      renderCard(vi.fn(), { ...MENU, poster: POSTER_BASE });
      mountMap();
      await openImageScreen();
      expect(screen.getByLabelText("Incluir cabeçalho e rodapé")).toBeChecked();
      download();

      const options = spy.mock.calls[0][1];

      expect(options.poster).toMatchObject({
        panelName: "Painel de Economia e Renda",
        title: "Mapa do PIB - Paraíba",
        subtitle: "PIB por município - 2021",
        source: PIB_CARD_SOURCE,
        updatedAt: "11/2026",
      });
      expect(options.poster?.legend.map((item) => item.label)).toEqual([
        "≤ R$ 500 Mi",
        "> R$ 500 Mi",
      ]);
    });

    it("downloads without the poster when the header and footer are off", async () => {
      const spy = vi
        .spyOn(chartImage, "downloadChartImage")
        .mockResolvedValue();

      renderCard(vi.fn(), { ...MENU, poster: POSTER_BASE });
      mountMap();
      await openImageScreen();
      fireEvent.click(screen.getByLabelText("Incluir cabeçalho e rodapé"));
      download();

      expect(spy.mock.calls[0][1]).toMatchObject({ framed: false });
      expect(spy.mock.calls[0][1].poster).toBeUndefined();
    });

    it("keeps the title-and-source image when the panel gives no poster base", async () => {
      const spy = vi
        .spyOn(chartImage, "downloadChartImage")
        .mockResolvedValue();

      renderCard();
      mountMap();
      await openImageScreen();
      expect(screen.getByLabelText("Incluir título e fonte")).toBeChecked();
      download();

      expect(spy.mock.calls[0][1].poster).toBeUndefined();
    });

    it("still downloads while the geodata has not arrived", async () => {
      const spy = vi
        .spyOn(chartImage, "downloadChartImage")
        .mockResolvedValue();

      renderCard(vi.fn(), { ...MENU, poster: POSTER_BASE });
      act(() => lastProps().onEngine?.(new PanelMapEngineFake()));
      await openImageScreen();
      download();

      expect(spy.mock.calls[0][1].poster).toMatchObject({
        legend: [],
        inset: null,
      });
    });
  });

  // O PanelMap só enquadra no fitTo: a altura não pode seguir a coluna dos
  // setores, que muda com o ano e o município com o mapa montado.
  it("keeps a fixed map height instead of following the sector column", () => {
    renderCard();

    const frame = lastProps().className ?? "";

    expect(frame).toMatch(/(^| )h-\[480px\]/);
    expect(frame).not.toContain("flex-1");
  });

  it("explains the PIB terms and the Obs. in the info balloon", async () => {
    renderCard();

    fireEvent.click(screen.getByRole("button", { name: "Sobre este gráfico" }));
    const term = await screen.findByText("Produto Interno Bruto (PIB)");
    const paragraphs = term.closest("p")?.parentElement?.querySelectorAll("p");

    expect(term.tagName).toBe("B");
    expect(screen.getByText("PIB per capita").tagName).toBe("B");
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs?.[2].textContent).toMatch(/^Obs\.: /);
  });
});
