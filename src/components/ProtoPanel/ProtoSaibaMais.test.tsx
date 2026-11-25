import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProtoSaibaMais } from "@/components/ProtoPanel/ProtoSaibaMais";

const SUMMARY = "O perfil demográfico reúne faixa etária, sexo e cor ou raça.";

const renderSaibaMais = () =>
  render(
    <ProtoSaibaMais
      tone="idh"
      title="Saiba mais"
      summary={SUMMARY}
      paragraphs={["Os municípios são agrupados pelo porte populacional."]}
      themeHref="/macrothemes/desenvolvimento-social"
    />,
  );

describe("ProtoSaibaMais", () => {
  it("mostra o resumo de cara, sem sanfona no celular", () => {
    renderSaibaMais();

    const summary = screen.getByText(SUMMARY);

    expect(summary.closest(".max-\\[700px\\]\\:hidden")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Expandir Saiba mais" }),
    ).toBeNull();
  });

  it("abre e fecha o texto completo pelo Ler mais", () => {
    renderSaibaMais();
    const readMore = screen.getByRole("button", { name: "Ler mais" });

    expect(readMore.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(readMore);

    expect(readMore.getAttribute("aria-expanded")).toBe("true");
    expect(readMore.textContent).toBe("Ler menos");
  });
});
