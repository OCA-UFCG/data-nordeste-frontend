import { describe, expect, it } from "vitest";
import { pickSearchSnippet } from "@/features/seo/searchSnippet";

describe("pickSearchSnippet", () => {
  it("uses the editorial snippet when it is filled", () => {
    const snippet = pickSearchSnippet(
      "Veja dados de analfabetismo no Nordeste.",
      "Texto longo do painel.",
    );

    expect(snippet).toBe("Veja dados de analfabetismo no Nordeste.");
  });

  it("trims whitespace pasted around the snippet", () => {
    expect(pickSearchSnippet("  Resumo curto.\n", "Fallback")).toBe(
      "Resumo curto.",
    );
  });

  it.each([undefined, null, "", "   "])(
    "falls back to the page description when the snippet is %j",
    (seoDescription) => {
      expect(pickSearchSnippet(seoDescription, "Texto longo do painel.")).toBe(
        "Texto longo do painel.",
      );
    },
  );
});
