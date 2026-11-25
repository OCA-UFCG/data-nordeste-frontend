import { describe, expect, it } from "vitest";

import {
  idhToRecorte,
  recorteToIdh,
  recorteToTerritorial,
  territorialToRecorte,
} from "@/features/panelMap/panelMapAdapters";
import { EMPTY_RECORTE } from "@/features/panelMap/mapRecorte";

describe("territorial adapters", () => {
  it("round-trips year, area and selection", () => {
    const filters = {
      ano: 2021,
      area: "semiarido" as const,
      uf: ["PE"],
      mun: ["2611606"],
    };

    const recorte = territorialToRecorte(filters);

    expect(recorte).toEqual({ uf: ["PE"], mun: ["2611606"] });
    expect(recorteToTerritorial(filters, recorte)).toEqual(filters);
  });

  it("reads missing uf/mun as empty", () => {
    expect(territorialToRecorte({ ano: 2021, area: "nordeste" })).toEqual(
      EMPTY_RECORTE,
    );
  });

  it("drops empty uf/mun but keeps year and area", () => {
    const filters = { ano: 2021, area: "caatinga" as const, uf: ["PE"] };
    const result = recorteToTerritorial(filters, EMPTY_RECORTE);

    expect(result).toEqual({ ano: 2021, area: "caatinga" });
    expect("uf" in result).toBe(false);
    expect("mun" in result).toBe(false);
  });

  it("applies a new recorte over the current filters", () => {
    const filters = { ano: 2021, area: "nordeste" as const };

    expect(
      recorteToTerritorial(filters, { uf: ["PE", "PB"], mun: [] }),
    ).toEqual({ ano: 2021, area: "nordeste", uf: ["PE", "PB"] });
  });
});

describe("idh adapters", () => {
  it("reads the single state as a recorte", () => {
    expect(idhToRecorte({ ano: 2010, visao: "geral", uf: "PE" })).toEqual({
      uf: ["PE"],
      mun: [],
    });
    expect(idhToRecorte({ ano: 2010, visao: "geral" })).toEqual(EMPTY_RECORTE);
  });

  it("keeps year and view and uses only the first state", () => {
    const filters = { ano: 2010, visao: "geral" as const };

    expect(recorteToIdh(filters, { uf: ["PE", "PB"], mun: [] })).toEqual({
      ano: 2010,
      visao: "geral",
      uf: "PE",
    });
  });

  it("drops the state when the recorte is empty", () => {
    const filters = { ano: 2010, visao: "geral" as const, uf: "PE" };
    const result = recorteToIdh(filters, EMPTY_RECORTE);

    expect(result).toEqual({ ano: 2010, visao: "geral" });
    expect("uf" in result).toBe(false);
  });
});
