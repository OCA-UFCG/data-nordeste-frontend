import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PANEL_MAP_HINT } from "@/components/PanelMap/panelMapTexts";
import {
  MAP_STAGE_FRAME,
  ProtoMapFullscreen,
} from "@/components/ProtoPanel/ProtoMapFullscreen";

describe("ProtoMapFullscreen rodapé", () => {
  it("mostra a fonte e esconde a dica quando não há hint", () => {
    render(
      <ProtoMapFullscreen
        open
        onOpenChange={() => {}}
        title="Mapa"
        subtitle="s"
        source="Fonte: X"
        renderStage={() => <div />}
      />,
    );

    expect(screen.getByText("Fonte: X")).toBeTruthy();
    expect(screen.queryByText(PANEL_MAP_HINT)).toBeNull();
  });

  it("mostra a dica quando recebe hint", () => {
    render(
      <ProtoMapFullscreen
        open
        onOpenChange={() => {}}
        title="Mapa"
        subtitle="s"
        source="Fonte: X"
        hint={PANEL_MAP_HINT}
        renderStage={() => <div />}
      />,
    );

    expect(screen.getByText(PANEL_MAP_HINT)).toBeTruthy();
  });
});

describe("ProtoMapFullscreen palco do painel", () => {
  it("entrega a classe da caixa do mapa ao painel, que decide onde aplicá-la", () => {
    render(
      <ProtoMapFullscreen
        open
        onOpenChange={() => {}}
        title="Mapa"
        subtitle="s"
        source="Fonte: X"
        renderStage={(frame) => <div data-testid="palco" className={frame} />}
      />,
    );

    expect(screen.getByTestId("palco")).toHaveClass(
      ...MAP_STAGE_FRAME.split(" "),
    );
  });
});
