import { describe, expect, it } from "vitest";
import { loadPibPanel } from "@/features/panels/pib/pibPanel";

type RecordedQuery = { sql: string; params: unknown[] };

const MUNICIPIOS = [
  { cd_mun: "2507507", municipio_uf: "João Pessoa (PB)" },
  { cd_mun: "2611606", municipio_uf: "Recife (PE)" },
];

// Imita o WHERE do banco: só devolve municípios das UFs passadas como parâmetro.
const municipiosIn = (params: unknown[]) => {
  const ufs = params
    .flat()
    .map(String)
    .filter((param) => /^[A-Z]{2}$/.test(param));

  return ufs.length
    ? MUNICIPIOS.filter((row) =>
        ufs.some((uf) => row.municipio_uf.includes(uf)),
      )
    : MUNICIPIOS;
};

class PibDatabaseFake {
  readonly calls: RecordedQuery[] = [];

  constructor(private readonly vabServicos: string | null = "413890000") {}

  readonly query = async <Row>(sql: string, params: unknown[]) => {
    this.calls.push({ sql, params });

    return this.rowsFor(sql, params) as Row[];
  };

  callFor(fragment: string): RecordedQuery {
    const call = this.calls.find(({ sql }) => sql.includes(fragment));

    if (!call) throw new Error(`No query containing "${fragment}" was run.`);

    return call;
  }

  private rowsFor(sql: string, params: unknown[]): object[] {
    if (sql.includes("DISTINCT sigla_uf")) {
      return [
        { sigla_uf: "PB", estado_uf: "Paraíba" },
        { sigla_uf: "PE", estado_uf: "Pernambuco" },
      ];
    }
    if (sql.includes("municipio_uf FROM")) return municipiosIn(params);
    if (sql.includes("GROUP BY ano")) {
      return [{ ano: 2017, pib: "953430000000", per_capita: "16652.57" }];
    }
    if (sql.includes("SUM(vab_agropecuaria)")) {
      return [
        {
          vab_agropecuaria: "55430000",
          vab_industria: "158360000",
          vab_adm_publica: "211920000",
          vab_servicos: this.vabServicos,
        },
      ];
    }
    if (sql.includes("atividade_maior_vab AS atividade")) {
      return [{ atividade: "Demais serviços", participacao: "31.949" }];
    }

    return [];
  }
}

describe("loadPibPanel", () => {
  it("converts numeric strings and VAB thousands into reais", async () => {
    const db = new PibDatabaseFake();
    const panel = await loadPibPanel(db.query, {
      ano: 2017,
      area: "nordeste",
    });

    expect(panel.serie).toEqual([
      { ano: 2017, pib: 953430000000, perCapita: 16652.57 },
    ]);
    expect(panel.vab?.find((item) => item.label === "Serviços")?.value).toBe(
      413890000000,
    );
    expect(panel.atividades[0]).toEqual({
      label: "Demais serviços",
      value: 31.949,
    });
  });

  it("returns null VAB when IBGE has not released the year", async () => {
    const db = new PibDatabaseFake(null);
    const panel = await loadPibPanel(db.query, {
      ano: 2023,
      area: "nordeste",
    });

    expect(panel.vab).toBeNull();
  });

  it("passes user filters as bind parameters, never inside the SQL", async () => {
    const db = new PibDatabaseFake();

    await loadPibPanel(db.query, {
      ano: 2017,
      area: "semiarido",
      uf: ["PE"],
      mun: ["2611606"],
    });

    const serie = db.callFor("GROUP BY ano");

    expect(serie.sql).toContain("semiarido = 'Sim'");
    expect(serie.sql).not.toContain("PE");
    expect(serie.params).toEqual(["PE", "2611606"]);
  });

  it("keeps the map at area and state level when a municipality is selected", async () => {
    const db = new PibDatabaseFake();

    await loadPibPanel(db.query, {
      ano: 2017,
      area: "nordeste",
      uf: ["PE"],
      mun: ["2611606"],
    });

    expect(db.callFor("nome_municipio, sigla_uf, pib_total").params).toEqual([
      2017,
      "PE",
    ]);
  });

  it("drops a state or municipality outside the selection", async () => {
    const db = new PibDatabaseFake();
    const panel = await loadPibPanel(db.query, {
      ano: 2017,
      area: "nordeste",
      uf: ["SP"],
      mun: ["3550308"],
    });

    expect(panel.filters).toEqual({ ano: 2017, area: "nordeste" });
    expect(db.callFor("GROUP BY ano").params).toEqual([]);
  });

  it("filters several states and municipalities with array parameters", async () => {
    const db = new PibDatabaseFake();
    const panel = await loadPibPanel(db.query, {
      ano: 2017,
      area: "nordeste",
      uf: ["PB", "PE", "SP"],
      mun: ["2611606", "2507507", "3550308"],
    });

    expect(panel.filters).toMatchObject({
      uf: ["PB", "PE"],
      mun: ["2611606", "2507507"],
    });
    const serie = db.callFor("GROUP BY ano");

    expect(serie.sql).toContain("sigla_uf = ANY($1) AND cd_mun = ANY($2)");
    expect(serie.params).toEqual([
      ["PB", "PE"],
      ["2611606", "2507507"],
    ]);
    expect(db.callFor("nome_municipio, sigla_uf, pib_total").params).toEqual([
      2017,
      ["PB", "PE"],
    ]);
  });

  it("drops municipalities outside the selected states", async () => {
    const db = new PibDatabaseFake();
    const panel = await loadPibPanel(db.query, {
      ano: 2017,
      area: "nordeste",
      uf: ["PB"],
      mun: ["2611606", "2507507"],
    });

    expect(panel.municipios.map((item) => item.cdMun)).toEqual(["2507507"]);
    expect(panel.filters.mun).toEqual(["2507507"]);
  });
});
