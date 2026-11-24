import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IdhOverview } from "@/components/IdhDashboard/IdhOverview";
import {
  allIdhCards,
  idhPanelFixture,
} from "@/components/IdhDashboard/idhTestFixtures";
import type { PanelMapProps } from "@/components/PanelMap/PanelMap";
import { IDH_CARD_SOURCE } from "@/components/IdhDashboard/idhTheme";
import {
  ProtoCardMenuContext,
  type ProtoCardMenuContextValue,
} from "@/components/ProtoPanel/ProtoCardMenu";
import type { MapRecorte } from "@/features/panelMap/mapRecorte";
import { idhToRecorte } from "@/features/panelMap/panelMapAdapters";
import { formatIdhCard } from "@/features/panels/idh/idhFormat";
import type { IdhCardStates } from "@/features/panels/idh/idhCardState";
import type { IdhFilters } from "@/features/panels/idh/idhPanel";
import { stubPanelBrowserApis } from "@/components/ProtoPanel/protoBrowserFakes";

// O mapa é MapLibre (canvas); o dublê só guarda as props de cada montagem.
const panelMapRenders = vi.hoisted(() => [] as PanelMapProps[]);

vi.mock("@/components/PanelMap/PanelMap", () => ({
  PanelMap: (props: PanelMapProps) => {
    panelMapRenders.push(props);

    return <div data-testid="panel-map" aria-label={props.label} />;
  },
}));

const FILTERS: IdhFilters = { ano: 2021, visao: "geral", uf: "CE" };

const MENU: ProtoCardMenuContextValue = {
  share: { path: "/demo/idh", chips: [] },
  catalogHref: null,
  imageSource: IDH_CARD_SOURCE,
};

const lastProps = (): PanelMapProps =>
  panelMapRenders[panelMapRenders.length - 1];

const overview = (
  states: IdhCardStates,
  onFiltersChange: (filters: IdhFilters) => void = vi.fn(),
  onSelectUf: (uf: string) => void = vi.fn(),
) => (
  <ProtoCardMenuContext.Provider value={MENU}>
    <IdhOverview
      data={idhPanelFixture(FILTERS)}
      selection={FILTERS}
      states={states}
      onRetry={vi.fn()}
      onSelectUf={onSelectUf}
      onSelectYear={vi.fn()}
      onFiltersChange={onFiltersChange}
    />
  </ProtoCardMenuContext.Provider>
);

const emit = (recorte: MapRecorte) =>
  act(() => lastProps().onRecorteChange(recorte));

describe("IdhOverview", () => {
  beforeEach(() => {
    panelMapRenders.length = 0;
    stubPanelBrowserApis();
  });

  it("renders the state-level IDH map for the Northeast, year and selected state", () => {
    render(overview(allIdhCards("ok")));

    expect(lastProps()).toMatchObject({
      indicator: "idh",
      ano: 2021,
      area: "nordeste",
      deepest: "estado",
      label: "Mapa do IDH por estado do Nordeste",
      formatValue: formatIdhCard,
      valueLabel: "IDH",
    });

    // Duas casas, a precisão do IDH nos shapes do Drive.
    expect(lastProps().formatValue(0.7123)).toBe("0,71");
    expect(lastProps().recorte).toEqual({ uf: ["CE"], mun: [] });
  });

  // A aridez vive só no painel dela: nem raster nem checkbox neste mapa.
  it("keeps the aridez raster and its checkbox out of the map", () => {
    render(overview(allIdhCards("ok")));

    expect(lastProps().aridez ?? "off").toBe("off");
    expect(screen.queryByRole("checkbox", { name: /aridez/i })).toBeNull();
  });

  it("turns a state zoom into the filters of the filter bar request", () => {
    const onFiltersChange = vi.fn();

    render(overview(allIdhCards("ok"), onFiltersChange));
    emit({ uf: ["PE"], mun: [] });

    expect(onFiltersChange).toHaveBeenCalledWith({
      ano: 2021,
      visao: "geral",
      uf: "PE",
    });
  });

  it("clears the state filter when the zoom goes back to the Northeast", () => {
    const onFiltersChange = vi.fn();

    render(overview(allIdhCards("ok"), onFiltersChange));
    emit({ uf: [], mun: [] });

    expect(onFiltersChange).toHaveBeenCalledWith({ ano: 2021, visao: "geral" });
  });

  // IMPORTANT: o PanelMap só evita reenquadrar se o recorte devolvido pelo
  // painel for igual ao que ele emitiu.
  it("sends filters whose recorte equals the one the map emitted", () => {
    const onFiltersChange = vi.fn<(filters: IdhFilters) => void>();
    const emitted: MapRecorte = { uf: ["PE"], mun: [] };

    render(overview(allIdhCards("ok"), onFiltersChange));
    emit(emitted);

    const [requested] = onFiltersChange.mock.calls[0];

    expect(idhToRecorte(requested)).toEqual(emitted);
  });

  it("keeps the ranking selecting through its own handler, not the map's", () => {
    const onFiltersChange = vi.fn();
    const onSelectUf = vi.fn();

    render(overview(allIdhCards("ok"), onFiltersChange, onSelectUf));
    fireEvent.click(screen.getAllByRole("button", { name: /Pernambuco/ })[0]);

    expect(onSelectUf).toHaveBeenCalledWith("PE");
    expect(onFiltersChange).not.toHaveBeenCalled();
  });

  it("opens a second map in the fullscreen dialog wired to the same filters", () => {
    const onFiltersChange = vi.fn();

    render(overview(allIdhCards("ok"), onFiltersChange));
    fireEvent.click(
      screen.getByRole("button", { name: "Abrir mapa em tela cheia" }),
    );

    expect(screen.getAllByTestId("panel-map")).toHaveLength(2);
    emit({ uf: ["BA"], mun: [] });
    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ uf: "BA" }),
    );
  });

  it("credits the OpenStreetMap basemap in the downloaded image source", async () => {
    render(overview(allIdhCards("ok")));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Mais opções: Mapa do IDH por estado",
      }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Baixar imagem" }),
    );

    expect(
      await screen.findByText(
        `${IDH_CARD_SOURCE} · Basemap: © OpenStreetMap contributors`,
      ),
    ).toBeInTheDocument();
  });

  // Regressão (revisão da PR #397): o diálogo ficava nos children do card, que
  // o esqueleto substitui, e era desmontado a cada estado clicado em tela cheia.
  it("keeps the fullscreen map open while the map card reloads", () => {
    const { rerender } = render(overview(allIdhCards("ok")));

    fireEvent.click(
      screen.getByRole("button", { name: "Abrir mapa em tela cheia" }),
    );
    const dialog = screen.getByRole("dialog");

    rerender(overview(allIdhCards("loading")));

    expect(screen.getByRole("dialog")).toBe(dialog);
  });
});
