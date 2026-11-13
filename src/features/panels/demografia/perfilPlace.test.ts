import { describe, expect, it } from "vitest";
import {
  describePerfilDefaultLabel,
  describePerfilPlace,
  describePerfilShareChips,
  isDefaultPerfilFilters,
  togglePerfilUf,
} from "@/features/panels/demografia/perfilPlace";
import { DEMOGRAFIA_YEAR_RANGE } from "@/features/panels/demografia/demografiaPanel";

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

describe("describePerfilPlace", () => {
  it("names only the area when nothing narrower is chosen", () => {
    const filters = { ano: 2022, area: "nordeste" as const };

    expect(describePerfilPlace({ ...OPTIONS, filters })).toBe("Nordeste");
  });

  it("joins area, states and municipalities with a middle dot", () => {
    const filters = {
      ano: 2022,
      area: "semiarido" as const,
      uf: ["PE"],
      mun: ["2611606"],
    };

    expect(describePerfilPlace({ ...OPTIONS, filters })).toBe(
      "Semiárido · Pernambuco · Recife (PE)",
    );
  });

  it("summarizes many states and municipalities like the Mostrando line", () => {
    const filters = {
      ano: 2022,
      area: "nordeste" as const,
      uf: ["PB", "PE", "RN"],
      mun: ["2507507", "2604106", "2611606"],
    };

    expect(describePerfilPlace({ ...OPTIONS, filters })).toBe(
      "Nordeste · 3 estados · 3 municípios (PB, PE, RN)",
    );
  });
});

describe("describePerfilShareChips", () => {
  it("lists year, area and 'Todos' when no place is chosen", () => {
    const filters = { ano: 2022, area: "nordeste" as const };

    expect(describePerfilShareChips({ ...OPTIONS, filters })).toEqual([
      "Ano: 2022",
      "Área: Nordeste",
      "Estado: Todos",
      "Município: Todos",
    ]);
  });

  it("names the chosen states and municipalities", () => {
    const filters = {
      ano: 2010,
      area: "caatinga" as const,
      uf: ["PB", "PE"],
      mun: ["2611606"],
    };

    expect(describePerfilShareChips({ ...OPTIONS, filters })).toEqual([
      "Ano: 2010",
      "Área: Caatinga",
      "Estado: Paraíba, Pernambuco",
      "Município: Recife (PE)",
    ]);
  });
});

describe("togglePerfilUf", () => {
  it("adds a state that is not chosen yet and drops the municipality", () => {
    const filters = {
      ano: 2022,
      area: "nordeste" as const,
      uf: ["PB"],
      mun: ["2507507"],
    };

    expect(togglePerfilUf(filters, "PE")).toEqual({
      ano: 2022,
      area: "nordeste",
      uf: ["PB", "PE"],
      mun: undefined,
    });
  });

  it("removes a state already chosen and clears the list when it was the last", () => {
    const filters = { ano: 2022, area: "nordeste" as const, uf: ["PE"] };

    expect(togglePerfilUf(filters, "PE").uf).toBeUndefined();
  });
});

describe("isDefaultPerfilFilters", () => {
  it("is true only for the last census, Nordeste, no state and no municipality", () => {
    const range = DEMOGRAFIA_YEAR_RANGE;

    expect(isDefaultPerfilFilters({ ano: 2022, area: "nordeste" }, range)).toBe(
      true,
    );
    expect(isDefaultPerfilFilters({ ano: 2010, area: "nordeste" }, range)).toBe(
      false,
    );
    expect(
      isDefaultPerfilFilters(
        { ano: 2022, area: "nordeste", uf: ["PE"] },
        range,
      ),
    ).toBe(false);
    expect(isDefaultPerfilFilters({ ano: 2022, area: "sudene" }, range)).toBe(
      false,
    );
  });
});

describe("describePerfilDefaultLabel", () => {
  it("names the default place and census for the empty-state button", () => {
    expect(describePerfilDefaultLabel(DEMOGRAFIA_YEAR_RANGE)).toBe(
      "Ver Nordeste · 2022",
    );
  });
});
