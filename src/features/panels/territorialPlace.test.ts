import { describe, expect, it } from "vitest";
import {
  describeDefaultPlaceLabel,
  describeTerritorialAreaPlace,
  describeTerritorialPlace,
  describeTerritorialShareChips,
  isDefaultTerritorialFilters,
  selectOnlyTerritorialUf,
  toggleTerritorialUf,
} from "@/features/panels/territorialPlace";
import { DEMOGRAFIA_YEAR_RANGE } from "@/features/panels/demografia/demografiaPanel";
import { NO_DEMOGRAFIA_YEARS } from "@/features/panels/demografia/demografiaYearRange";
import { NO_YEAR } from "@/features/panels/territorialFilters";

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

describe("describeTerritorialPlace", () => {
  it("names only the area when nothing narrower is chosen", () => {
    const filters = { ano: 2022, area: "nordeste" as const };

    expect(describeTerritorialPlace({ ...OPTIONS, filters })).toBe("Nordeste");
  });

  it("joins area, states and municipalities with a middle dot", () => {
    const filters = {
      ano: 2022,
      area: "semiarido" as const,
      uf: ["PE"],
      mun: ["2611606"],
    };

    expect(describeTerritorialPlace({ ...OPTIONS, filters })).toBe(
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

    expect(describeTerritorialPlace({ ...OPTIONS, filters })).toBe(
      "Nordeste · 3 estados · 3 municípios (PB, PE, RN)",
    );
  });
});

describe("describeTerritorialShareChips", () => {
  it("lists year, area and 'Todos' when no place is chosen", () => {
    const filters = { ano: 2022, area: "nordeste" as const };

    expect(describeTerritorialShareChips({ ...OPTIONS, filters })).toEqual([
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

    expect(describeTerritorialShareChips({ ...OPTIONS, filters })).toEqual([
      "Ano: 2010",
      "Área: Caatinga",
      "Estado: Paraíba, Pernambuco",
      "Município: Recife (PE)",
    ]);
  });

  it("leaves the year out when the database gave none", () => {
    const filters = { ano: NO_YEAR, area: "nordeste" as const };

    expect(describeTerritorialShareChips({ ...OPTIONS, filters })).toEqual([
      "Área: Nordeste",
      "Estado: Todos",
      "Município: Todos",
    ]);
  });
});

describe("selectOnlyTerritorialUf", () => {
  const BASE = { ano: 2022, area: "nordeste" as const };

  it("keeps only the clicked state and drops the municipality", () => {
    expect(
      selectOnlyTerritorialUf(
        { ...BASE, uf: ["PB", "PE"], mun: ["2507507"] },
        "RN",
      ),
    ).toEqual({ ...BASE, uf: ["RN"], mun: undefined });
    expect(
      selectOnlyTerritorialUf({ ...BASE, uf: ["PB", "PE"] }, "PE").uf,
    ).toEqual(["PE"]);
  });

  it("clears the filter when the clicked state is the only one chosen", () => {
    expect(selectOnlyTerritorialUf({ ...BASE, uf: ["PE"] }, "PE").uf).toBe(
      undefined,
    );
  });
});

describe("toggleTerritorialUf", () => {
  it("adds a state that is not chosen yet and drops the municipality", () => {
    const filters = {
      ano: 2022,
      area: "nordeste" as const,
      uf: ["PB"],
      mun: ["2507507"],
    };

    expect(toggleTerritorialUf(filters, "PE", 9)).toEqual({
      ano: 2022,
      area: "nordeste",
      uf: ["PB", "PE"],
      mun: undefined,
    });
  });

  it("removes a state already chosen and clears the list when it was the last", () => {
    const filters = { ano: 2022, area: "nordeste" as const, uf: ["PE"] };

    expect(toggleTerritorialUf(filters, "PE", 9).uf).toBeUndefined();
  });

  it("keeps only the clicked state once the place limit is reached", () => {
    const filters = { ano: 2022, area: "nordeste" as const, uf: ["PB", "RN"] };

    expect(toggleTerritorialUf(filters, "PE", 2).uf).toEqual(["PE"]);
  });

  it("still removes a chosen state when the limit is reached", () => {
    const filters = { ano: 2022, area: "nordeste" as const, uf: ["PB", "RN"] };

    expect(toggleTerritorialUf(filters, "RN", 2).uf).toEqual(["PB"]);
  });

  it("behaves as a single-value filter with a limit of one", () => {
    const filters = { ano: 2022, area: "nordeste" as const, uf: ["PB"] };

    expect(toggleTerritorialUf(filters, "PE", 1).uf).toEqual(["PE"]);
  });
});

describe("isDefaultTerritorialFilters", () => {
  it("is true only for the last census, Nordeste, no state and no municipality", () => {
    const range = DEMOGRAFIA_YEAR_RANGE;

    expect(
      isDefaultTerritorialFilters({ ano: 2022, area: "nordeste" }, range),
    ).toBe(true);
    expect(
      isDefaultTerritorialFilters({ ano: 2010, area: "nordeste" }, range),
    ).toBe(false);
    expect(
      isDefaultTerritorialFilters(
        { ano: 2022, area: "nordeste", uf: ["PE"] },
        range,
      ),
    ).toBe(false);
    expect(
      isDefaultTerritorialFilters({ ano: 2022, area: "sudene" }, range),
    ).toBe(false);
  });
});

describe("describeDefaultPlaceLabel", () => {
  it("names the default place and census for the empty-state button", () => {
    expect(describeDefaultPlaceLabel(DEMOGRAFIA_YEAR_RANGE)).toBe(
      "Ver Nordeste · 2022",
    );
  });

  it("leaves the year out when the database gave none", () => {
    expect(describeDefaultPlaceLabel(NO_DEMOGRAFIA_YEARS)).toBe("Ver Nordeste");
  });
});

describe("describeTerritorialAreaPlace", () => {
  it("names area and states but omits the chosen municipality", () => {
    const filters = {
      ano: 2022,
      area: "semiarido" as const,
      uf: ["PE"],
      mun: ["2611606"],
    };

    expect(describeTerritorialAreaPlace({ ...OPTIONS, filters })).toBe(
      "Semiárido · Pernambuco",
    );
  });
});
