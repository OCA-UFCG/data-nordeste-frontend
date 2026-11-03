import { describe, expect, it } from "vitest";
import {
  DEMOGRAFIA_YEAR_RANGE,
  loadDemografiaPanel,
  topMunicipios,
} from "@/features/panels/demografia/demografiaPanel";
import { parseTerritorialFilters } from "@/features/panels/territorialFilters";

type RecordedQuery = { sql: string; params: unknown[] };

class DemografiaDatabaseFake {
  readonly calls: RecordedQuery[] = [];

  readonly query = async <Row>(sql: string, params: unknown[]) => {
    this.calls.push({ sql, params });

    return this.rowsFor(sql) as Row[];
  };

  callFor(fragment: string): RecordedQuery {
    const call = this.calls.find(({ sql }) => sql.includes(fragment));

    if (!call) throw new Error(`No query containing "${fragment}" was run.`);

    return call;
  }

  private rowsFor(sql: string): object[] {
    if (sql.includes("DISTINCT sigla_uf")) {
      return [{ sigla_uf: "CE", estado_uf: "Ceará" }];
    }
    if (sql.includes("municipio_uf FROM")) {
      return [{ cd_mun: "2304400", municipio_uf: "Fortaleza (CE)" }];
    }
    if (sql.includes("SUM(mulher) AS mulher")) {
      return [
        {
          mulher: "28240713",
          homem: "26417802",
          parda: "32559846",
          branca: "14571557",
          preta: "7127018",
          indigena: "327725",
          amarela: "68749",
        },
      ];
    }

    return [];
  }
}

describe("loadDemografiaPanel", () => {
  it("sorts race groups and keeps sex totals", async () => {
    const db = new DemografiaDatabaseFake();
    const panel = await loadDemografiaPanel(db.query, {
      ano: 2022,
      area: "nordeste",
    });

    expect(panel.sexo).toEqual({ mulheres: 28240713, homens: 26417802 });
    expect(panel.corRaca.map((item) => item.label)).toEqual([
      "Parda",
      "Branca",
      "Preta",
      "Indígena",
      "Amarela",
    ]);
  });

  it("maps the census area columns and binds the filters", async () => {
    const db = new DemografiaDatabaseFake();

    await loadDemografiaPanel(db.query, {
      ano: 2010,
      area: "semiarido",
      uf: ["CE"],
      mun: ["2304400"],
    });
    const serie = db.callFor("GROUP BY ano");

    expect(serie.sql).toContain("semi_21 AS semiarido");
    expect(serie.sql).toContain("semiarido = 'Sim'");
    expect(serie.params).toEqual(["CE", "2304400"]);
    expect(db.callFor("GROUP BY cd_mun").params).toEqual([2010, "CE"]);
  });
});

describe("census years", () => {
  it("accept only 2000, 2010 and 2022", () => {
    const parse = (ano: string) =>
      parseTerritorialFilters({ ano }, DEMOGRAFIA_YEAR_RANGE).ano;

    expect(parse("2010")).toBe(2010);
    expect(parse("2015")).toBe(2022);
  });
});

describe("topMunicipios", () => {
  it("returns the most populous municipalities with their state", () => {
    const regions = [
      { code: "1", name: "Recife", uf: "PE", value: 1_488_920 },
      { code: "2", name: "Fortaleza", uf: "CE", value: 2_428_708 },
      { code: "3", name: "Crato", uf: "CE", value: 131_050 },
    ];

    expect(topMunicipios(regions, 2)).toEqual([
      { label: "Fortaleza (CE)", value: 2_428_708 },
      { label: "Recife (PE)", value: 1_488_920 },
    ]);
  });
});
