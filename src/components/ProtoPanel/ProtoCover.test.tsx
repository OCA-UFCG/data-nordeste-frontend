import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProtoCover } from "@/components/ProtoPanel/ProtoCover";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: () => {} }),
}));

describe("ProtoCover", () => {
  // A capa tem um só visual, o claro: aridez e PIB, que não passavam prop,
  // saíam no fundo escuro.
  it("renders the light cover for every panel", () => {
    render(
      <ProtoCover
        tone="aridez"
        icon="users"
        title="Índice de Aridez"
        lead="Texto de abertura"
        macroTheme="Meio Ambiente"
      />,
    );
    const cover = screen.getByRole("heading", { level: 1 }).closest("section");

    expect(cover).toHaveClass("bg-grey-100", "text-grey-1100");
    expect(cover).not.toHaveClass("bg-grey-1000");
    expect(screen.getByRole("link", { name: "Voltar" })).toHaveClass(
      "focus-visible:outline-(--proto-accent-strong)",
    );
  });
});
