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

describe("ProtoCard skeleton", () => {
  it("troca o esqueleto genérico pelo do card enquanto carrega", () => {
    render(
      <ProtoCard
        title="Evolução"
        subtitle="Nordeste"
        actions={null}
        state="loading"
        kind="line"
        onRetry={() => {}}
        skeleton={<div data-testid="esqueleto-do-card" />}
      >
        <p>conteúdo do gráfico</p>
      </ProtoCard>,
    );

    expect(screen.getByLabelText("Carregando")).toContainElement(
      screen.getByTestId("esqueleto-do-card"),
    );
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

  it("mostra a segunda ação ao lado da primeira, cada uma com o seu clique", () => {
    const onPrimary = vi.fn();
    const onSecondary = vi.fn();

    render(
      <ProtoCardNotice
        tone="warn"
        action={{ label: "Ver 2021", onClick: onPrimary }}
        secondaryAction={{ label: "Escolher outro ano", onClick: onSecondary }}
      >
        Sem dados.
      </ProtoCardNotice>,
    );

    screen.getByRole("button", { name: "Escolher outro ano" }).click();

    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(onSecondary).toHaveBeenCalledTimes(1);
    expect(onPrimary).not.toHaveBeenCalled();
  });
});
