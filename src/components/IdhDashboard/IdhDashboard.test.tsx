import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IdhDashboard } from "@/components/IdhDashboard/IdhDashboard";
import { idhPanelFixture } from "@/components/IdhDashboard/idhTestFixtures";
import { IDH_CARD_SOURCE } from "@/components/IdhDashboard/idhTheme";
import {
  emptyIdhPanel,
  parseIdhFilters,
  type IdhFilters,
} from "@/features/panels/idh/idhPanel";
import { NO_IDH_YEARS } from "@/features/panels/idh/idhYearRange";
import { stubPanelBrowserApis } from "@/components/ProtoPanel/protoBrowserFakes";

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

const mapState = (name: string) =>
  within(
    screen.getByRole("group", { name: /Mapa do IDH por estado/ }),
  ).getByRole("button", { name: new RegExp(`^${name}`) });

describe("IdhDashboard", () => {
  beforeEach(() => {
    stubPanelBrowserApis();
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

  it("renders a single tab list, above the filter bar", () => {
    render(dashboard(GERAL));

    const [tabList] = screen.getAllByRole("tablist");
    const clear = screen.getByRole("button", { name: "Limpar filtros" });

    expect(screen.getAllByRole("tablist")).toHaveLength(1);
    expect(
      tabList.compareDocumentPosition(clear) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("follows the view when a link changes it on the server", () => {
    const { rerender } = render(dashboard(GERAL));

    rerender(dashboard({ ...GERAL, visao: "cor" }));

    expect(tab("Visão por cor")).toHaveAttribute("aria-selected", "true");
  });

  it("shows the skeleton only on the cards whose data the pending state changes", () => {
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

  it("offers the years of the database range", () => {
    const data = {
      ...idhPanelFixture({ ...GERAL, ano: 2023 }),
      yearRange: { first: 2018, last: 2023 },
    };

    render(<IdhDashboard data={data} catalogHref="/catalog" />);
    const years = within(screen.getAllByLabelText("Ano")[0])
      .getAllByRole("option")
      .map((option) => option.textContent);

    expect(years).toEqual(["2018", "2019", "2020", "2021", "2022", "2023"]);
  });

  // A fonte fica só na seção "Fonte dos dados" do painel, não em cada card.
  it("shows no source under the charts", () => {
    render(dashboard(GERAL));

    expect(screen.queryByText(IDH_CARD_SOURCE)).toBeNull();
  });

  it("shows the Contentful date in the card footers, and nothing without it", () => {
    const { rerender } = render(
      <IdhDashboard
        data={idhPanelFixture(GERAL)}
        catalogHref="/catalog"
        updatedAt="10/2026"
      />,
    );

    expect(screen.getAllByText("Atualizado em 10/2026").length).toBeGreaterThan(
      0,
    );
    rerender(dashboard(GERAL));

    expect(screen.queryByText(/Atualizado em/)).toBeNull();
  });

  // Regressão (revisão da PR #411): sem o intervalo de anos, o resumo do
  // celular e os subtítulos mostravam o ano 0 ("Nordeste · 0").
  it("shows no year when the years query failed", () => {
    const filters = parseIdhFilters({}, NO_IDH_YEARS);

    render(
      <IdhDashboard
        data={emptyIdhPanel(filters, NO_IDH_YEARS)}
        failed
        catalogHref="/catalog"
      />,
    );
    fireEvent.click(tab("Visão por sexo"));

    expect(document.body.textContent).not.toMatch(/[·,]\s*0(?!\d)/);
    expect(
      screen.queryAllByRole("option", { name: "0", hidden: true }),
    ).toEqual([]);
  });
});
