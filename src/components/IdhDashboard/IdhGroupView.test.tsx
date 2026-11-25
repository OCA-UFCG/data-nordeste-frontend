import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { IdhGroupView } from "@/components/IdhDashboard/IdhGroupView";
import { idhPanelFixture } from "@/components/IdhDashboard/idhTestFixtures";
import { stubPanelBrowserApis } from "@/components/ProtoPanel/protoBrowserFakes";
import type { IdhGroupSerie } from "@/features/panels/idh/idhPanel";

const groupInYear = (label: string, idh: number): IdhGroupSerie => ({
  label,
  serie: [
    {
      ano: 2021,
      idh,
      gini: 0.5,
      rendaPerCapita: 900,
      rendimento: 1800,
    },
  ],
});

const renderSexoView = () =>
  render(
    <IdhGroupView
      visao="sexo"
      data={{
        ...idhPanelFixture({ ano: 2021, visao: "sexo", uf: "PE" }),
        sexo: [groupInYear("Homens", 0.7), groupInYear("Mulheres", 0.72)],
      }}
      state="ok"
      onRetry={() => {}}
      onReset={() => {}}
    />,
  );

const openInfoOf = (title: string) => {
  const card = screen
    .getByRole("heading", { name: new RegExp(`^${title}`) })
    .closest("article")!;

  fireEvent.click(
    within(card).getByRole("button", { name: "Sobre este gráfico" }),
  );

  return screen.getByRole("dialog");
};

describe("IdhGroupView", () => {
  beforeEach(stubPanelBrowserApis);

  // Revisão do painel (25/11/2026): o ⓘ das visões por sexo e cor explica o
  // indicador, como na visão geral, e mantém a leitura das barras.
  it("explains the Gini index and how to read the bars in its ⓘ", () => {
    renderSexoView();

    const info = openInfoOf("Índice de Gini");

    expect(info).toHaveTextContent("0 (zero) indica igualdade perfeita");
    expect(info).toHaveTextContent("Compara os dois grupos");
  });

  it("explains the per capita income in its ⓘ", () => {
    renderSexoView();

    expect(openInfoOf("Renda per capita")).toHaveTextContent(
      "Renda per capita é um indicador",
    );
  });
});
