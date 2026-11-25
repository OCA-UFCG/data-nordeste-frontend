// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProtoSaibaMais } from "@/components/ProtoPanel/ProtoSaibaMais";

afterEach(cleanup);

const renderSaibaMais = (alwaysOpen?: boolean) =>
  render(
    <ProtoSaibaMais
      tone="pib"
      title="Saiba mais"
      summary="Resumo"
      paragraphs={["Parágrafo um"]}
      alwaysOpen={alwaysOpen}
      themeHref={null}
    />,
  );

describe("ProtoSaibaMais", () => {
  it("por padrão, tem o botão Ler mais", () => {
    renderSaibaMais();
    expect(screen.getByRole("button", { name: "Ler mais" })).toBeTruthy();
  });

  it("com alwaysOpen, mostra os parágrafos sem botão Ler mais", () => {
    renderSaibaMais(true);
    expect(
      screen.queryByRole("button", { name: /Ler (mais|menos)/ }),
    ).toBeNull();
    expect(
      screen.getByText("Parágrafo um").closest("[aria-hidden]"),
    ).toHaveAttribute("aria-hidden", "false");
  });
});
