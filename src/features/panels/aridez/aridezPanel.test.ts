import { describe, expect, it } from "vitest";
import {
  emptyAridezPanel,
  loadAridezPanel,
} from "@/features/panels/aridez/aridezPanel";

type RecordedQuery = { sql: string; params: unknown[] };

const classRow = (semiarido: string, umido: string) => ({
  arido: "0",
  semiarido,
  subumido: "0",
  umido,
});

// Responde pelo trecho do SQL, como o PibDatabaseFake.
class AridezDatabaseFake {
  readonly calls: RecordedQuery[] = [];

  constructor(private readonly years = [2021, 1991]) {}

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
      return [{ sigla_uf: "PE", estado_uf: "Pernambuco" }];
    }
    if (sql.includes("municipio_uf FROM")) {
      return [{ cd_mun: "2611101", municipio_uf: "Petrolina (PE)" }];
    }
    if (sql.includes("GROUP BY ano")) {
      return this.years.map((ano) => ({
        ano,
        ...classRow(ano === 2021 ? "800" : "700", "200"),
      }));
    }
    if (sql.includes("GROUP BY sigla_uf")) {
      return [
        { sigla_uf: "PE ", estado_uf: "Pernambuco", ...classRow("75", "25") },
      ];
    }
    if (sql.includes("GROUP BY cd_mun")) {
      return [
        {
          cd_mun: "2611101",
          municipio_uf: "Petrolina (PE)",
          ...classRow("4560", "0"),
        },
        {
          cd_mun: "2611606",
          municipio_uf: "Recife (PE)",
          ...classRow("0", "0"),
        },
      ];
    }

    return [];
  }
}

describe("loadAridezPanel", () => {
  it("loads the chosen and the 1991 areas in one query", async () => {
    const db = new AridezDatabaseFake();
    const panel = await loadAridezPanel(db.query, {
      ano: 2021,
      area: "nordeste",
    });

    expect(panel.areas?.semiarido).toBe(800);
    expect(panel.baseAreas?.semiarido).toBe(700);
    expect(db.callFor("GROUP BY ano").params.at(-1)).toEqual([2021, 1991]);
  });

  it("reads class codes from the class table, never from the request", async () => {
    const db = new AridezDatabaseFake();

    await loadAridezPanel(db.query, { ano: 2021, area: "semiarido" });

    expect(db.callFor("GROUP BY ano").sql).toContain(
      "FILTER (WHERE classe = '3'), 0) AS semiarido",
    );
    expect(db.callFor("GROUP BY ano").sql).toContain("semiarido = 'Sim'");
  });

  it("maps states with their ASD share and trims the code", async () => {
    const db = new AridezDatabaseFake();
    const panel = await loadAridezPanel(db.query, {
      ano: 2021,
      area: "nordeste",
    });

    expect(panel.estados).toEqual([
      expect.objectContaining({ code: "PE", name: "Pernambuco", value: 75 }),
    ]);
  });

  it("drops municipalities without classified area", async () => {
    const db = new AridezDatabaseFake();
    const panel = await loadAridezPanel(db.query, {
      ano: 2021,
      area: "nordeste",
    });

    expect(panel.porMunicipio.map(({ nome }) => nome)).toEqual([
      "Petrolina (PE)",
    ]);
  });

  it("returns null areas for a year the view does not have", async () => {
    const db = new AridezDatabaseFake([2021]);
    const panel = await loadAridezPanel(db.query, {
      ano: 2021,
      area: "nordeste",
    });

    expect(panel.baseAreas).toBeNull();
  });

  it("starts empty for the failure fallback", () => {
    expect(emptyAridezPanel({ ano: 2021, area: "nordeste" })).toMatchObject({
      areas: null,
      estados: [],
      porMunicipio: [],
    });
  });
});
