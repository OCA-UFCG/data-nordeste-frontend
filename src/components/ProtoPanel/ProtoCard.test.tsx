import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  ProtoCard,
  ProtoCardNotice,
  type ProtoCardState,
} from "@/components/ProtoPanel/ProtoCard";

const renderCard = (state: ProtoCardState, overlay?: ReactNode) => (
  <ProtoCard
    title="Mapa do IDH por estado"
    subtitle="Faixas · 2022"
    actions={null}
    state={state}
    kind="map"
    onRetry={() => {}}
    overlay={overlay}
  >
    <p>conteúdo do gráfico</p>
  </ProtoCard>
);

describe("ProtoCard overlay", () => {
  it("mantém o overlay montado quando o corpo entra em carregamento", () => {
    const { rerender } = render(
      renderCard("ok", <div data-testid="overlay" />),
    );
    const overlay = screen.getByTestId("overlay");

    rerender(renderCard("loading", <div data-testid="overlay" />));

    expect(screen.getByTestId("overlay")).toBe(overlay);
    expect(screen.queryByText("conteúdo do gráfico")).toBeNull();
    expect(screen.getByLabelText("Carregando")).toBeTruthy();
  });
});

describe("ProtoCardNotice", () => {
  it("mostra um único botão quando recebe action", () => {
    const onClick = vi.fn();

    render(
      <ProtoCardNotice tone="warn" action={{ label: "Ver Nordeste", onClick }}>
        Sem dados.
      </ProtoCardNotice>,
    );

    const buttons = screen.getAllByRole("button");

    expect(buttons).toHaveLength(1);
    buttons[0].click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
