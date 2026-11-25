import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PerfilMunicipiosCard } from "@/components/DemografiaDashboard/PerfilMunicipiosCard";
import { PERFIL_DESMEMBRAMENTO_NOTE } from "@/components/DemografiaDashboard/perfilTexts";
import { emptyDemografiaPanel } from "@/features/panels/demografia/demografiaPanel";

// O jsdom não tem matchMedia; o ⓘ do card pergunta se a tela é de celular.
const matchMediaFake = (query: string) => ({
  matches: false,
  media: query,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
});

const PANEL = {
  ...emptyDemografiaPanel({ ano: 2022, area: "nordeste" }),
  mapa: [
    { code: "2304400", name: "Fortaleza", uf: "CE", value: 2_428_708 },
    { code: "2927408", name: "Salvador", uf: "BA", value: 2_417_678 },
  ],
};

describe("PerfilMunicipiosCard", () => {
  beforeEach(() => vi.stubGlobal("matchMedia", matchMediaFake));
  afterEach(() => vi.unstubAllGlobals());

  it("explains in the info balloon why some municipalities lack older censuses", async () => {
    render(
      <PerfilMunicipiosCard
        data={PANEL}
        place="Nordeste"
        state="ok"
        onRetry={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sobre este gráfico" }));

    expect(
      await screen.findByText(PERFIL_DESMEMBRAMENTO_NOTE),
    ).toBeInTheDocument();
  });
});
