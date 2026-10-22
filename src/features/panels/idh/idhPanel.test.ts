import { describe, expect, it } from "vitest";
import {
  buildIdhSearch,
  describeIdhSelection,
  loadIdhPanel,
  parseIdhFilters,
} from "@/features/panels/idh/idhPanel";

type RecordedQuery = { sql: string; params: unknown[] };

class IdhDatabaseFake {
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
      return [{ sigla_uf: "PE", estado_1: "Pernambuco" }];
    }
    if (sql.includes("AVG(idh_ad)")) {
      return [{ ano: 2021, idh: "0.702", idh_ad: "0.518", rdpct: "467.43" }];
    }
    if (sql.includes("sexo AS grupo")) {
      return [
        { ano: 2021, grupo: "MULHER", idh: "0.735", renocup: "845.27" },
        { ano: 2021, grupo: "HOMEM", idh: "0.670", renocup: "989.44" },
      ];
    }

    return [];
  }
}

describe("loadIdhPanel", () => {
  it("averages the states and splits the sex view by group", async () => {
    const db = new IdhDatabaseFake();
    const panel = await loadIdhPanel(db.query, {
      ano: 2021,
      recorte: "estado",
      visao: "geral",
    });

    expect(panel.serie[0]).toMatchObject({
      idh: 0.702,
      idhAjustado: 0.518,
      rendaPerCapita: 467.43,
    });
    expect(panel.sexo.map((group) => group.label)).toEqual([
      "Mulheres",
      "Homens",
    ]);
    expect(panel.sexo[1].serie[0].rendimento).toBe(989.44);
    expect(panel.cor.every((group) => group.serie.length === 0)).toBe(true);
  });

  it("binds recorte and UF, and keeps the ranking at all states", async () => {
    const db = new IdhDatabaseFake();

    await loadIdhPanel(db.query, {
      ano: 2021,
      recorte: "rm",
      visao: "geral",
      uf: "PE",
    });

    expect(db.callFor("AVG(idh_ad)").params).toEqual(["Sim", "PE"]);
    expect(db.callFor("estado_rm AS lugar").params).toEqual(["Sim", 2021]);
  });

  it("drops a UF that is not in the data", async () => {
    const db = new IdhDatabaseFake();
    const panel = await loadIdhPanel(db.query, {
      ano: 2021,
      recorte: "estado",
      visao: "cor",
      uf: "SP",
    });

    expect(panel.filters).toEqual({
      ano: 2021,
      recorte: "estado",
      visao: "cor",
    });
    expect(describeIdhSelection(panel)).toBe(
      "Média dos estados do Nordeste · 2021",
    );
  });
});

describe("parseIdhFilters and buildIdhSearch", () => {
  it("round-trips non-default filters and rejects invalid values", () => {
    const filters = parseIdhFilters({
      ano: "2015",
      recorte: "rm",
      visao: "sexo",
      uf: "pe",
    });

    expect(buildIdhSearch(filters)).toBe(
      "?ano=2015&recorte=rm&uf=PE&visao=sexo",
    );
    expect(
      parseIdhFilters({ ano: "1999", recorte: "x", visao: "y", uf: "PE'" }),
    ).toEqual({ ano: 2021, recorte: "estado", visao: "geral" });
  });
});
