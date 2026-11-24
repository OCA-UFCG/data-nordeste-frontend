import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PanelMapProps } from "@/components/PanelMap/PanelMap";
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

const lastProps = (): PanelMapProps =>
  panelMapRenders[panelMapRenders.length - 1];

const renderCard = (
  onFiltersChange: (filters: TerritorialFilters) => void = vi.fn(),
) =>
  render(
    <ProtoCardMenuContext.Provider value={MENU}>
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
      screen.getByRole("heading", { name: "Mapa do PIB por município" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/^PIB total · .+ · 2021$/)).toBeInTheDocument();
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

  // IMPORTANT: o PanelMap só evita reenquadrar se o recorte devolvido pelo
  // painel for igual ao que ele emitiu; sem esse ciclo o mapa "pula" no zoom.
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
        name: "Mais opções: Mapa do PIB por município",
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
});
