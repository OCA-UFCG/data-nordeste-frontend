import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PerfilPiramideCard } from "@/components/DemografiaDashboard/PerfilPiramideCard";
import type { PerfilCardProps } from "@/components/DemografiaDashboard/perfilCardProps";
import type { DemografiaPanelData } from "@/features/panels/demografia/demografiaPanel";

// O jsdom não tem matchMedia; o ⓘ do card pergunta se a tela é de celular.
const matchMediaFake = (query: string) => ({
  matches: false,
  media: query,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
});

// Três faixas bastam para testar o padrão (30 a 39) e um clique em outra faixa.
const PIRAMIDE: DemografiaPanelData["piramide"] = [
  { faixa: "0 a 9 anos", mulheres: 5_000_000, homens: 5_200_000 },
  { faixa: "30 a 39 anos", mulheres: 7_000_000, homens: 6_500_000 },
  { faixa: "80+ anos", mulheres: 2_000_000, homens: 1_400_000 },
];

const FIXTURE: DemografiaPanelData = {
  filters: { ano: 2022, area: "nordeste" } as DemografiaPanelData["filters"],
  ufs: [],
  municipios: [],
  serie: [],
  sexo: { mulheres: 0, homens: 0 },
  corRaca: [],
  corRacaAnterior: null,
  piramide: PIRAMIDE,
  mapa: [],
};

const props: PerfilCardProps = {
  data: FIXTURE,
  place: "Nordeste",
  state: "ok",
  onRetry: () => undefined,
};

// O cabeçalho que lê a faixa tem aria-live; é o que o teste confere.
const liveHeader = (): HTMLElement => {
  const header = document.querySelector<HTMLElement>("[aria-live='polite']");

  if (!header) throw new Error("Pyramid header with aria-live not rendered.");

  return header;
};

describe("PerfilPiramideCard", () => {
  beforeEach(() => vi.stubGlobal("matchMedia", matchMediaFake));
  afterEach(() => vi.unstubAllGlobals());

  it("shows the 30 a 39 band in the header by default", () => {
    render(<PerfilPiramideCard {...props} />);
    const header = liveHeader();

    expect(
      within(header).getByText("Faixa de 30 a 39 anos"),
    ).toBeInTheDocument();
    expect(within(header).getByText("7.000.000")).toBeInTheDocument();
    expect(within(header).getByText("6.500.000")).toBeInTheDocument();
  });

  it("selects the band clicked and updates the header", () => {
    render(<PerfilPiramideCard {...props} />);
    const header = liveHeader();

    fireEvent.click(
      screen.getByRole("button", {
        name: "80+ anos: mulheres 2.000.000, homens 1.400.000",
      }),
    );

    expect(within(header).getByText("Faixa de 80 anos ou mais")).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: "80+ anos: mulheres 2.000.000, homens 1.400.000",
      }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
