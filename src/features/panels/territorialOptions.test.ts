import { describe, expect, it } from "vitest";
import { describeTerritorialSelection } from "@/features/panels/territorialOptions";

const OPTIONS = {
  ufs: [{ sigla: "PE", nome: "Pernambuco" }],
  municipios: [{ cdMun: "2611606", nome: "Recife (PE)" }],
};

describe("describeTerritorialSelection", () => {
  it("names the most specific place selected", () => {
    const filters = { ano: 2017, area: "nordeste", uf: "PE" } as const;

    expect(describeTerritorialSelection({ ...OPTIONS, filters })).toBe(
      "Pernambuco · 2017",
    );
    expect(
      describeTerritorialSelection({
        ...OPTIONS,
        filters: { ...filters, mun: "2611606" },
      }),
    ).toBe("Recife (PE) · 2017");
  });

  it("falls back to the whole area", () => {
    expect(
      describeTerritorialSelection({
        ...OPTIONS,
        filters: { ano: 2023, area: "nordeste" },
      }),
    ).toBe("Todos os municípios da área · 2023");
  });
});
