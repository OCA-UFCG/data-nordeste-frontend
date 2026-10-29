import { describe, expect, it } from "vitest";
import { describeTerritorialSelection } from "@/features/panels/territorialOptions";

const OPTIONS = {
  ufs: [
    { sigla: "PB", nome: "Paraíba" },
    { sigla: "PE", nome: "Pernambuco" },
    { sigla: "RN", nome: "Rio Grande do Norte" },
  ],
  municipios: [
    { cdMun: "2507507", nome: "João Pessoa (PB)" },
    { cdMun: "2604106", nome: "Caruaru (PE)" },
    { cdMun: "2611606", nome: "Recife (PE)" },
  ],
};

describe("describeTerritorialSelection", () => {
  it("names the area when nothing narrower is selected, if asked", () => {
    const filters = { ano: 2021, area: "sudene" as const };

    expect(describeTerritorialSelection({ ...OPTIONS, filters })).toBe(
      "Todos os municípios da área · 2021",
    );
    expect(describeTerritorialSelection({ ...OPTIONS, filters }, true)).toBe(
      "Área da Sudene · 2021",
    );
  });

  it("names the most specific place selected", () => {
    const filters = { ano: 2017, area: "nordeste" as const, uf: ["PE"] };

    expect(describeTerritorialSelection({ ...OPTIONS, filters })).toBe(
      "Pernambuco · 2017",
    );
    expect(
      describeTerritorialSelection({
        ...OPTIONS,
        filters: { ...filters, mun: ["2611606"] },
      }),
    ).toBe("Recife (PE) · 2017");
  });

  it("names up to two places and counts the rest", () => {
    const describe = (uf?: string[], mun?: string[]) =>
      describeTerritorialSelection({
        ...OPTIONS,
        filters: { ano: 2021, area: "nordeste", uf, mun },
      });

    expect(describe(["PB", "PE"])).toBe("Paraíba e Pernambuco · 2021");
    expect(describe(["PB", "PE", "RN"])).toBe("3 estados · 2021");
    expect(describe(undefined, ["2507507", "2611606"])).toBe(
      "João Pessoa (PB) e Recife (PE) · 2021",
    );
    expect(describe(["PB", "PE"], ["2507507", "2604106", "2611606"])).toBe(
      "3 municípios (PB, PE) · 2021",
    );
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
