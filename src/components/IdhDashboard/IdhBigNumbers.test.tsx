import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { IdhBigNumbers } from "@/components/IdhDashboard/IdhBigNumbers";
import { idhPanelFixture } from "@/components/IdhDashboard/idhTestFixtures";
import { stubPanelBrowserApis } from "@/components/ProtoPanel/protoBrowserFakes";

const renderBigNumbers = () =>
  render(
    <IdhBigNumbers
      data={idhPanelFixture({ ano: 2021, visao: "geral", uf: "PE" })}
      state="ok"
      onRetry={() => {}}
    />,
  );

describe("IdhBigNumbers", () => {
  beforeEach(stubPanelBrowserApis);

  // Revisão do painel (25/11/2026): cada indicador explica o que mede no ⓘ.
  it("gives each of the five indicators its ⓘ", () => {
    renderBigNumbers();

    expect(
      screen.getAllByRole("button", { name: "Sobre este gráfico" }),
    ).toHaveLength(5);
  });

  it("explains the Gini index in its ⓘ", () => {
    renderBigNumbers();

    const gini = screen
      .getByText("Índice de Gini")
      .closest<HTMLElement>(".rounded-\\[8px\\]");

    fireEvent.click(
      within(gini!).getByRole("button", { name: "Sobre este gráfico" }),
    );

    expect(screen.getByRole("dialog")).toHaveTextContent(
      "0 (zero) indica igualdade perfeita",
    );
  });
});
