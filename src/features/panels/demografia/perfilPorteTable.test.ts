import { describe, expect, it } from "vitest";
import { buildPerfilPorteTable } from "@/features/panels/demografia/perfilPorteTable";
import { emptyDemografiaPanel } from "@/features/panels/demografia/demografiaPanel";
import type { TerritorialFilters } from "@/features/panels/territorialFilters";

const FILTERS: TerritorialFilters = { ano: 2022, area: "nordeste" };

const municipio = (name: string, uf: string, value: number) => ({
  code: `${name}-${uf}`,
  name,
  uf,
  value,
});

describe("buildPerfilPorteTable", () => {
  it("sorts municipalities by population, largest first", () => {
    const table = buildPerfilPorteTable({
      filters: FILTERS,
      mapa: [
        municipio("Sobral", "CE", 210000),
        municipio("Fortaleza", "CE", 2400000),
        municipio("Crato", "CE", 130000),
      ],
    });

    expect(table.rows.map(([name]) => name)).toEqual([
      "Fortaleza (CE)",
      "Sobral (CE)",
      "Crato (CE)",
    ]);
  });

  it("formats the population and the porte label from the bucket", () => {
    const table = buildPerfilPorteTable({
      filters: FILTERS,
      mapa: [municipio("Crato", "CE", 130000), municipio("Vila", "PB", 800)],
    });

    expect(table.rows).toEqual([
      ["Crato (CE)", "130.000", "Grande"],
      ["Vila (PB)", "800", "Pequeno"],
    ]);
  });

  it("names the columns and captions the table with the year", () => {
    const table = buildPerfilPorteTable({ filters: FILTERS, mapa: [] });

    expect(table.columns).toEqual(["Município", "População", "Porte"]);
    expect(table.caption).toContain("2022");
  });

  it("returns no rows when the map is empty", () => {
    const table = buildPerfilPorteTable(emptyDemografiaPanel(FILTERS));

    expect(table.rows).toEqual([]);
  });
});
