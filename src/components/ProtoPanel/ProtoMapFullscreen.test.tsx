import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  MAP_SELECT_HINT,
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
