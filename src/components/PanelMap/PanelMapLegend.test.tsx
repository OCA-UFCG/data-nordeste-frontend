import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PETROLINA,
  RECIFE,
  STYLES_FIXTURE,
} from "@/components/PanelMap/panelMapFixtures";
import { renderPanelMap } from "@/components/PanelMap/renderPanelMap";
import {
  classHighlightFilter,
  predominantClassFilter,
} from "@/features/panelMap/classHighlight";

afterEach(() => {
  vi.unstubAllGlobals();
});

const PIB_CLASSES = STYLES_FIXTURE.indicators.pib.classes;

const chip = (name: RegExp) => screen.getByRole("button", { name });

describe("PanelMapLegend destaque da classe", () => {
  it("mouse numa pílula destaca a classe no mapa; sair desfaz", async () => {
    const { engine } = await renderPanelMap();

    fireEvent.pointerEnter(chip(/> R\$ 500 Mi/), { pointerType: "mouse" });

    expect(engine.setClassHighlight).toHaveBeenLastCalledWith(
      classHighlightFilter(PIB_CLASSES, 2023, 1),
    );

    fireEvent.pointerLeave(chip(/> R\$ 500 Mi/), { pointerType: "mouse" });

    expect(engine.setClassHighlight).toHaveBeenLastCalledWith(null);
  });

  // O Safari não foca botões no toque: o toque alterna o destaque.
  it("tocar uma pílula alterna o destaque", async () => {
    const { engine } = await renderPanelMap();

    fireEvent.pointerUp(chip(/> R\$ 500 Mi/), { pointerType: "touch" });

    expect(engine.setClassHighlight).toHaveBeenLastCalledWith(
      classHighlightFilter(PIB_CLASSES, 2023, 1),
    );

    fireEvent.pointerUp(chip(/> R\$ 500 Mi/), { pointerType: "touch" });

    expect(engine.setClassHighlight).toHaveBeenLastCalledWith(null);
  });

  it("o clique do mouse não alterna (o mouse destaca pelo hover)", async () => {
    const { engine } = await renderPanelMap();

    fireEvent.pointerUp(chip(/> R\$ 500 Mi/), { pointerType: "mouse" });

    expect(engine.setClassHighlight).not.toHaveBeenCalledWith(
      expect.anything(),
    );
  });

  it("tirar o mouse não desfaz o destaque da pílula com foco", async () => {
    const { engine } = await renderPanelMap();

    fireEvent.focus(chip(/≤ R\$ 500 Mi/));
    fireEvent.pointerEnter(chip(/> R\$ 500 Mi/), { pointerType: "mouse" });
    fireEvent.pointerLeave(chip(/> R\$ 500 Mi/), { pointerType: "mouse" });

    expect(engine.setClassHighlight).toHaveBeenLastCalledWith(
      classHighlightFilter(PIB_CLASSES, 2023, 0),
    );
  });

  it("o toque não destaca pelo ponteiro (o foco é que destaca)", async () => {
    const { engine } = await renderPanelMap();

    fireEvent.pointerEnter(chip(/> R\$ 500 Mi/), { pointerType: "touch" });

    expect(engine.setClassHighlight).not.toHaveBeenCalledWith(
      expect.anything(),
    );
  });

  it("o foco do teclado destaca; perder o foco desfaz", async () => {
    const { engine } = await renderPanelMap();

    fireEvent.focus(chip(/≤ R\$ 500 Mi/));

    expect(engine.setClassHighlight).toHaveBeenLastCalledWith(
      classHighlightFilter(PIB_CLASSES, 2023, 0),
    );

    fireEvent.blur(chip(/≤ R\$ 500 Mi/));

    expect(engine.setClassHighlight).toHaveBeenLastCalledWith(null);
  });

  it("a pílula Sem dado destaca as feições sem valor", async () => {
    const { engine } = await renderPanelMap({ ano: 2022 });

    fireEvent.focus(chip(/Sem dado/));

    expect(engine.setClassHighlight).toHaveBeenLastCalledWith(
      classHighlightFilter(PIB_CLASSES, 2022, "nodata"),
    );
  });

  it("trocar o ano com a pílula destacada refaz o filtro do ano novo", async () => {
    const { engine, rerender } = await renderPanelMap();

    fireEvent.focus(chip(/> R\$ 500 Mi/));
    rerender({ ano: 2022 });

    expect(engine.setClassHighlight).toHaveBeenLastCalledWith(
      classHighlightFilter(PIB_CLASSES, 2022, 1),
    );
  });

  it("as pílulas descrevem o destaque para leitores de tela", async () => {
    await renderPanelMap();

    expect(chip(/≤ R\$ 500 Mi/)).toHaveAccessibleDescription(
      "Passe o mouse, toque ou leve o foco a uma classe para destacá-la no mapa.",
    );
  });
});

describe("PanelMapLegend destaque na aridez", () => {
  const aridezMap = {
    indicator: "aridez",
    ano: 2021,
    formatValue: (value: number) => `${value}%`,
    label: "Mapa do índice de aridez",
  } as const;

  it("destaca os municípios cuja classe predominante é a da pílula", async () => {
    const classOf = new Map([
      [RECIFE.code, 3],
      [PETROLINA.code, 2],
    ]);
    const { engine } = await renderPanelMap({ ...aridezMap, classOf });

    fireEvent.pointerEnter(chip(/Semiárido/), { pointerType: "mouse" });

    expect(engine.setClassHighlight).toHaveBeenLastCalledWith(
      predominantClassFilter(classOf, 3),
    );
    expect(predominantClassFilter(classOf, 3)).toEqual([
      "in",
      ["get", "code"],
      ["literal", [RECIFE.code]],
    ]);
  });

  it("sem classe por município, a pílula não destaca nada", async () => {
    const { engine } = await renderPanelMap(aridezMap);

    fireEvent.focus(chip(/Árido/));

    expect(engine.setClassHighlight).not.toHaveBeenCalledWith(
      expect.anything(),
    );
  });
});
