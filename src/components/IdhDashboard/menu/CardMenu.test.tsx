import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CardMenu } from "@/components/IdhDashboard/menu/CardMenu";

class ClipboardFake {
  readonly written: string[] = [];

  readonly writeText = async (text: string) => {
    this.written.push(text);
  };
}

// O jsdom não tem matchMedia; o menu pergunta se a tela é de celular.
class ScreenWidthFake {
  constructor(private readonly isPhone: boolean) {}

  readonly matchMedia = (query: string) => ({
    matches: this.isPhone,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  });
}

const openMenu = () =>
  fireEvent.click(
    screen.getByRole("button", { name: "Mais opções: Mapa do IDH" }),
  );

const SHARE = { path: "/demo/idh?uf=PE", chips: ["Estado: Pernambuco"] };

describe("CardMenu", () => {
  beforeEach(() =>
    vi.stubGlobal("matchMedia", new ScreenWidthFake(false).matchMedia),
  );
  afterEach(() => vi.unstubAllGlobals());

  it("opens as a bottom sheet titled by the card on a phone", async () => {
    vi.stubGlobal("matchMedia", new ScreenWidthFake(true).matchMedia);
    render(<CardMenu title="Mapa do IDH" share={SHARE} catalogHref={null} />);
    await waitFor(() => openMenu());

    expect(
      await screen.findByRole("dialog", { name: "Mapa do IDH" }),
    ).toBeInTheDocument();
  });

  it("copies the absolute link with the panel filters", async () => {
    const clipboard = new ClipboardFake();

    vi.stubGlobal("navigator", { ...navigator, clipboard });
    render(<CardMenu title="Mapa do IDH" share={SHARE} catalogHref={null} />);
    openMenu();
    fireEvent.click(screen.getByRole("button", { name: "Compartilhar" }));
    fireEvent.click(screen.getByRole("button", { name: "Copiar link" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Link copiado."),
    );
    expect(clipboard.written).toEqual([
      `${window.location.origin}/demo/idh?uf=PE`,
    ]);
    expect(screen.getByText("Estado: Pernambuco")).toBeInTheDocument();
  });

  it("offers the image download only for charts that can export one", () => {
    render(<CardMenu title="Mapa do IDH" share={SHARE} catalogHref={null} />);
    openMenu();

    expect(
      screen.queryByRole("button", { name: "Baixar imagem" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Este dado ainda não tem página no catálogo."),
    ).toBeInTheDocument();
  });

  it("links to the catalog when the panel has a page there", () => {
    render(
      <CardMenu
        title="Mapa do IDH"
        share={SHARE}
        catalogHref="/catalog?category=desenvolvimento-social"
      />,
    );
    openMenu();

    expect(
      screen.getByRole("link", { name: "Ver no catálogo de dados" }),
    ).toHaveAttribute("href", "/catalog?category=desenvolvimento-social");
  });
});
