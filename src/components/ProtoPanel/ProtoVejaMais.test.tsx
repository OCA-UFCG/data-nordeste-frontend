import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  stubPanelBrowserApis,
  stubPhoneMedia,
} from "@/components/ProtoPanel/protoBrowserFakes";
import { ProtoVejaMais } from "@/components/ProtoPanel/ProtoVejaMais";
import type { PanelAnalysis } from "@/features/panels/panelAnalysis";

const FOOTNOTE = "Texto gerado conforme os filtros: Nordeste · 2021.";

const analysis = (text: string): PanelAnalysis => ({
  blocks: [{ title: "Classificação do índice de aridez:", text }],
  footnote: FOOTNOTE,
});

const toggle = () => screen.getByRole("button", { name: /Veja análise/ });

describe("ProtoVejaMais", () => {
  beforeEach(stubPanelBrowserApis);

  it("abre e fecha o texto pelo botão flutuante", () => {
    render(<ProtoVejaMais analysis={analysis("Semiárido.")} state="ok" />);

    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText(FOOTNOTE)).toBeNull();
    fireEvent.click(toggle());

    expect(toggle().getAttribute("aria-expanded")).toBe("true");
    expect(
      screen.getByRole("dialog", { name: "Veja análise" }).textContent,
    ).toContain(FOOTNOTE);

    fireEvent.click(toggle());
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText(FOOTNOTE)).toBeNull();
  });

  it("fecha pelo ✕", () => {
    render(<ProtoVejaMais analysis={analysis("Semiárido.")} state="ok" />);
    fireEvent.click(toggle());

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));

    expect(toggle().getAttribute("aria-expanded")).toBe("false");
  });

  it("fecha pelo Esc e devolve o foco ao botão", () => {
    render(<ProtoVejaMais analysis={analysis("Semiárido.")} state="ok" />);
    fireEvent.click(toggle());

    fireEvent.keyDown(document, { key: "Escape" });

    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(toggle());
  });

  it("no celular abre a folha inferior", () => {
    stubPhoneMedia();
    render(<ProtoVejaMais analysis={analysis("Semiárido.")} state="ok" />);

    fireEvent.click(toggle());

    const sheet = screen.getByRole("dialog", { name: "Veja análise" });

    // `data-state` é do diálogo do Radix (a folha); o cartão não o tem.
    expect(sheet.getAttribute("data-state")).toBe("open");
    expect(sheet.textContent).toContain(FOOTNOTE);
  });

  it("ao abrir o cartão rola até a barra de filtros grudar", () => {
    const bar = document.createElement("div");

    bar.setAttribute("data-proto-filter-bar", "");
    bar.style.top = "84px";
    bar.getBoundingClientRect = () => ({ top: 452 }) as DOMRect;
    document.body.append(bar);
    const scrollBy = vi.fn();

    vi.stubGlobal("scrollBy", scrollBy);
    render(<ProtoVejaMais analysis={analysis("Semiárido.")} state="ok" />);

    fireEvent.click(toggle());

    expect(scrollBy).toHaveBeenCalledWith({ top: 368, behavior: "smooth" });
    bar.remove();
  });

  it("marca o texto que mudou com o cartão fechado e limpa ao abrir", () => {
    const { rerender } = render(
      <ProtoVejaMais analysis={analysis("Semiárido.")} state="ok" />,
    );

    expect(screen.queryByTitle("Texto atualizado")).toBeNull();
    rerender(<ProtoVejaMais analysis={analysis("Úmido.")} state="ok" />);
    expect(screen.getByTitle("Texto atualizado")).toBeTruthy();

    fireEvent.click(toggle());
    expect(screen.queryByTitle("Texto atualizado")).toBeNull();
  });

  it("não marca ao fechar o texto que mudou com o cartão aberto", () => {
    const { rerender } = render(
      <ProtoVejaMais analysis={analysis("Semiárido.")} state="ok" />,
    );

    fireEvent.click(toggle());
    rerender(<ProtoVejaMais analysis={analysis("Úmido.")} state="ok" />);
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
    fireEvent.click(toggle());

    expect(screen.getByText("Não foi possível carregar o texto.")).toBeTruthy();
  });

  it("lista os itens de um bloco sem parágrafo", () => {
    render(
      <ProtoVejaMais
        analysis={{
          blocks: [
            {
              title: "Quantidade de municípios por porte",
              items: ["A.", "B."],
            },
          ],
          footnote: "Rodapé.",
        }}
        state="ok"
      />,
    );
    fireEvent.click(toggle());

    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent),
    ).toEqual(["A.", "B."]);
  });
});
