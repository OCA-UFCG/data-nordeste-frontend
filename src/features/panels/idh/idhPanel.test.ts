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
    if (sql.includes("estado_rm AS lugar")) {
      return [{ lugar: "Pernambuco", uf: "PE", idh: "0.746" }];
    }
    if (sql.includes("sexo AS grupo")) {
      return [
        { ano: 2021, grupo: "MULHER", idh: "0.735", renocup: "845.27" },
        {
          ano: 2021,
          grupo: "HOMEM",
          idh: "0.670",
          gini: "0.556",
          renda: "484.43",
          renocup: "989.44",
        },
      ];
    }

    return [];
  }
}

describe("loadIdhPanel", () => {
  it("averages the states and splits the sex view by group", async () => {
    const db = new IdhDatabaseFake();
    const panel = await loadIdhPanel(db.query, { ano: 2021, visao: "geral" });

    expect(panel.serie[0]).toMatchObject({
      idh: 0.702,
      idhAjustado: 0.518,
      rendaPerCapita: 467.43,
    });
    expect(panel.sexo.map((group) => group.label)).toEqual(["Homem", "Mulher"]);
    expect(panel.sexo[0].serie[0]).toMatchObject({
      gini: 0.556,
      rendaPerCapita: 484.43,
      rendimento: 989.44,
    });
    expect(panel.cor.every((group) => group.serie.length === 0)).toBe(true);
  });

  it("reads the per capita income column each Power BI view uses", async () => {
    const db = new IdhDatabaseFake();

    await loadIdhPanel(db.query, { ano: 2021, visao: "geral" });

    expect(db.callFor("sexo AS grupo").sql).toContain("AVG(rdpct) AS renda");
    expect(db.callFor("cor AS grupo").sql).toContain("AVG(rdpc) AS renda");
  });

  it("binds the UF, keeps the map at all states and skips metropolitan rows", async () => {
    const db = new IdhDatabaseFake();

    await loadIdhPanel(db.query, { ano: 2021, visao: "geral", uf: "PE" });

    expect(db.callFor("AVG(idh_ad)").params).toEqual(["PE"]);
    expect(db.callFor("estado_rm AS lugar").params).toEqual([2021]);
    expect(
      db.calls.every(({ sql }) => sql.includes("regiao_metropolitana = 'Não'")),
    ).toBe(true);
  });

  it("passes user filters as bind parameters, never inside the SQL", async () => {
    const db = new IdhDatabaseFake();

    await loadIdhPanel(db.query, { ano: 2015, visao: "sexo", uf: "PE" });

    expect(db.calls.length).toBeGreaterThan(1);
    for (const { sql } of db.calls) {
      expect(sql).not.toContain("PE");
      expect(sql).not.toContain("2015");
    }
    expect(db.callFor("sexo AS grupo").params).toEqual(["PE"]);
    expect(db.callFor("estado_rm AS lugar").params).toEqual([2015]);
  });

  it("keys the map by UF so it matches the state mesh", async () => {
    const db = new IdhDatabaseFake();
    const panel = await loadIdhPanel(db.query, { ano: 2021, visao: "geral" });

    expect(panel.mapa).toEqual([
      { code: "PE", name: "Pernambuco", uf: "PE", value: 0.746 },
    ]);
  });

  it("drops a UF that is not in the data", async () => {
    const db = new IdhDatabaseFake();
    const panel = await loadIdhPanel(db.query, {
      ano: 2021,
      visao: "cor",
      uf: "SP",
    });

    expect(panel.filters).toEqual({ ano: 2021, visao: "cor" });
    expect(describeIdhSelection(panel)).toBe(
      "Média dos estados do Nordeste · 2021",
    );
  });
});

describe("parseIdhFilters and buildIdhSearch", () => {
  it("round-trips non-default filters and rejects invalid values", () => {
    const filters = parseIdhFilters({
      ano: "2015",
      visao: "sexo",
      uf: "pe",
    });

    expect(buildIdhSearch(filters)).toBe("?ano=2015&uf=PE&visao=sexo");
    expect(parseIdhFilters({ ano: "1999", visao: "y", uf: "PE'" })).toEqual({
      ano: 2021,
      visao: "geral",
    });
  });
});
