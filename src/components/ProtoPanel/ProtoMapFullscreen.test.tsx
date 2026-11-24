import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  MAP_SELECT_HINT,
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
    expect(screen.queryByText(MAP_SELECT_HINT)).toBeNull();
  });

  it("mostra a dica quando recebe hint", () => {
    render(
      <ProtoMapFullscreen
        open
        onOpenChange={() => {}}
        title="Mapa"
        subtitle="s"
        source="Fonte: X"
        hint={MAP_SELECT_HINT}
        renderStage={() => <div />}
      />,
    );

    expect(screen.getByText(MAP_SELECT_HINT)).toBeTruthy();
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
