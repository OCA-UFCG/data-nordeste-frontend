import { describe, expect, it } from "vitest";
import { buildTerritorialWhere } from "@/features/panels/territorialSql";

const BASE = { ano: 2021, area: "semiarido" } as const;
const ALL = { byYear: true, byMunicipality: true };

describe("buildTerritorialWhere", () => {
  it("keeps a single value as a plain bind parameter", () => {
    expect(
      buildTerritorialWhere({ ...BASE, uf: ["PB"], mun: ["2507507"] }, ALL),
    ).toEqual({
      sql: "semiarido = 'Sim' AND ano = $1 AND sigla_uf = $2 AND cd_mun = $3",
      params: [2021, "PB", "2507507"],
    });
  });

  it("binds several values as one array parameter", () => {
    expect(
      buildTerritorialWhere(
        { ...BASE, uf: ["PB", "PE"], mun: ["2507507", "2611606"] },
        ALL,
      ),
    ).toEqual({
      sql: "semiarido = 'Sim' AND ano = $1 AND sigla_uf = ANY($2) AND cd_mun = ANY($3)",
      params: [2021, ["PB", "PE"], ["2507507", "2611606"]],
    });
  });

  it("ignores municipalities outside the municipality scope", () => {
    expect(
      buildTerritorialWhere(
        { ...BASE, mun: ["2507507", "2611606"] },
        { byYear: false, byMunicipality: false },
      ),
    ).toEqual({ sql: "semiarido = 'Sim'", params: [] });
  });
});
