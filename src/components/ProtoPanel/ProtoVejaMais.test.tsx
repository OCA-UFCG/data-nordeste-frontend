import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProtoVejaMais } from "@/components/ProtoPanel/ProtoVejaMais";
import type { PanelAnalysis } from "@/features/panels/panelAnalysis";

const analysis = (text: string): PanelAnalysis => ({
  blocks: [{ title: "Classificação do índice de aridez:", text }],
  footnote: "Texto gerado conforme os filtros: Nordeste · 2021.",
});

const toggle = () => screen.getByRole("button", { name: /Veja mais/ });

describe("ProtoVejaMais", () => {
  it("abre e fecha o texto pelo cabeçalho", () => {
    render(<ProtoVejaMais analysis={analysis("Semiárido.")} state="ok" />);

    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle());

    expect(toggle().getAttribute("aria-expanded")).toBe("true");
    const body = document.getElementById(
      toggle().getAttribute("aria-controls") ?? "",
    );

    expect(body?.hidden).toBe(false);
    expect(
      screen.getByText("Texto gerado conforme os filtros: Nordeste · 2021."),
    ).toBeTruthy();
  });

  it("marca o texto que mudou com a barra fechada e limpa ao abrir", () => {
    const { rerender } = render(
      <ProtoVejaMais analysis={analysis("Semiárido.")} state="ok" />,
    );

    expect(screen.queryByTitle("Texto atualizado")).toBeNull();
    rerender(<ProtoVejaMais analysis={analysis("Úmido.")} state="ok" />);
    expect(screen.getByTitle("Texto atualizado")).toBeTruthy();

    fireEvent.click(toggle());
    expect(screen.queryByTitle("Texto atualizado")).toBeNull();
  });

  it("avisa quando não há texto para os filtros", () => {
    render(<ProtoVejaMais analysis={null} state="ok" />);
    fireEvent.click(toggle());

    expect(
      screen.getByText(
        "Não há texto disponível para a combinação de filtros selecionada.",
      ),
    ).toBeTruthy();
  });

  it("mostra o erro no lugar do texto", () => {
    render(<ProtoVejaMais analysis={analysis("Semiárido.")} state="error" />);

    expect(
      screen.getAllByText("Não foi possível carregar o texto.").length,
    ).toBeGreaterThan(0);
  });
});
