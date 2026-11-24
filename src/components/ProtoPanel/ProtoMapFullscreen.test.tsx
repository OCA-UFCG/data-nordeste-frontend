import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  MAP_SELECT_HINT,
  ProtoMapFullscreen,
} from "@/components/ProtoPanel/ProtoMapFullscreen";

describe("ProtoMapFullscreen rodapé", () => {
  it("não mostra fonte nem rodapé quando não há hint", () => {
    render(
      <ProtoMapFullscreen
        open
        onOpenChange={() => {}}
        title="Mapa"
        subtitle="s"
        renderStage={() => <div />}
      />,
    );

    expect(screen.queryByText(/Fonte/)).toBeNull();
    expect(screen.queryByText(MAP_SELECT_HINT)).toBeNull();
  });

  it("mostra a dica quando recebe hint", () => {
    render(
      <ProtoMapFullscreen
        open
        onOpenChange={() => {}}
        title="Mapa"
        subtitle="s"
        hint={MAP_SELECT_HINT}
        renderStage={() => <div />}
      />,
    );

    expect(screen.getByText(MAP_SELECT_HINT)).toBeTruthy();
  });
});
