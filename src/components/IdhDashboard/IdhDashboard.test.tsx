import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IdhDashboard } from "@/components/IdhDashboard/IdhDashboard";
import {
  idhPanelFixture,
  stubIdhBrowserApis,
} from "@/components/IdhDashboard/idhTestFixtures";
import type { PanelMapProps } from "@/components/PanelMap/PanelMap";
import type { IdhFilters } from "@/features/panels/idh/idhPanel";

// O mapa é MapLibre (canvas); o dublê só guarda as props de cada montagem.
const panelMapRenders = vi.hoisted(() => [] as PanelMapProps[]);

vi.mock("@/components/PanelMap/PanelMap", () => ({
  PanelMap: (props: PanelMapProps) => {
    panelMapRenders.push(props);

    return <div data-testid="panel-map" />;
  },
}));

// Navegação do painel controlada pelo teste: guarda os filtros pedidos e deixa
// o teste decidir quando a resposta do servidor está pendente.
class PanelNavigationFake {
  isPending = false;

  readonly requested: IdhFilters[] = [];

  applyFilters = (filters: IdhFilters) => {
    this.requested.push(filters);
  };

  get lastRequest() {
    return this.requested.at(-1);
  }
}

const navigation = vi.hoisted(() => ({
  current: null as unknown as PanelNavigationFake,
}));

vi.mock("@/components/Panel/filters/useTerritorialNavigation", () => ({
  usePanelNavigation: () => ({
    isPending: navigation.current.isPending,
    pathname: "/demo/idh",
    applyFilters: navigation.current.applyFilters,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {} }),
  usePathname: () => "/demo/idh",
}));

const GERAL: IdhFilters = { ano: 2021, visao: "geral" };

const dashboard = (filters: IdhFilters) => (
  <IdhDashboard data={idhPanelFixture(filters)} catalogHref="/catalog" />
);

// `hidden`: com a folha aberta, o Radix esconde o resto da página dos leitores
// de tela, e a aba só é encontrada incluindo os elementos ocultos.
const tab = (name: string) =>
  screen.getAllByRole("tab", { name, hidden: true })[0];

const cardBody = (title: RegExp) =>
  screen.getByRole("heading", { name: title }).closest("article")?.children[1];

// O ranking é o que escolhe estado por clique: o mapa filtra pelo zoom.
const mapState = (name: string) => screen.getByTitle(new RegExp(`^${name}:`));

describe("IdhDashboard", () => {
  beforeEach(() => {
    panelMapRenders.length = 0;
    stubIdhBrowserApis();
    navigation.current = new PanelNavigationFake();
  });

  // Regressão (revisão da PR #397): uma `key` com a visão remontava o painel
  // quando o servidor devolvia a aba trocada por replaceState, e a folha de
  // filtros do celular fechava sozinha.
  it("keeps the panel mounted when the server confirms the open tab", () => {
    const { rerender } = render(dashboard(GERAL));

    fireEvent.click(tab("Visão por sexo"));
    fireEvent.click(screen.getByRole("button", { name: /^Filtros$/ }));
    rerender(dashboard({ ...GERAL, uf: "PE", visao: "sexo" }));

    expect(screen.getByRole("dialog", { name: "Filtros" })).toBeVisible();
    expect(tab("Visão por sexo")).toHaveAttribute("aria-selected", "true");
  });

  it("follows the view when a link changes it on the server", () => {
    const { rerender } = render(dashboard(GERAL));

    rerender(dashboard({ ...GERAL, visao: "cor" }));

    expect(tab("Visão por cor")).toHaveAttribute("aria-selected", "true");
  });

  it("dims only the cards whose data the pending state changes", () => {
    const { rerender } = render(dashboard(GERAL));

    fireEvent.click(mapState("Pernambuco"));
    navigation.current.isPending = true;
    rerender(dashboard(GERAL));

    expect(cardBody(/^Evolução anual/)).toHaveAttribute("aria-busy", "true");
    expect(cardBody(/^Mapa do IDH/)).toHaveAttribute("aria-busy", "false");
    expect(cardBody(/^Ranking do IDH/)).toHaveAttribute("aria-busy", "false");
    expect(mapState("Pernambuco")).toHaveAttribute("aria-pressed", "true");
  });

  it("undoes the pending state on a second click before the server answers", () => {
    const { rerender } = render(dashboard(GERAL));

    fireEvent.click(mapState("Pernambuco"));
    navigation.current.isPending = true;
    rerender(dashboard(GERAL));
    fireEvent.click(mapState("Pernambuco"));

    expect(navigation.current.lastRequest).toEqual(GERAL);
  });

  it("starts the next filter from the pending one, not the loaded one", () => {
    const { rerender } = render(dashboard(GERAL));

    fireEvent.click(mapState("Pernambuco"));
    navigation.current.isPending = true;
    rerender(dashboard(GERAL));
    fireEvent.change(screen.getAllByLabelText("Ano")[0], {
      target: { value: "2020" },
    });

    expect(navigation.current.lastRequest).toEqual({
      ano: 2020,
      uf: "PE",
      visao: "geral",
    });
  });

  it("requests the zoomed state through the filter bar path, keeping the open view", () => {
    render(dashboard({ ...GERAL, ano: 2020 }));

    act(() => panelMapRenders.at(-1)?.onRecorteChange({ uf: ["PE"], mun: [] }));

    expect(navigation.current.lastRequest).toEqual({
      ano: 2020,
      uf: "PE",
      visao: "geral",
    });
  });
});
