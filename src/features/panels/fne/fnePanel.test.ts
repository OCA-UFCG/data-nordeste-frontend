import { describe, expect, it } from "vitest";
import { describeFneSelection } from "@/features/panels/fne/fneSelection";
import { toFneLayeredRegions } from "@/features/panels/fne/fneMap";
import { loadFnePanel, toFneChartPoints } from "@/features/panels/fne/fnePanel";

type RecordedQuery = { sql: string; params: unknown[] };

class FneDatabaseFake {
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
    if (sql.includes("DISTINCT i.sigla_uf")) {
      return [{ sigla_uf: "PE", uf: "Pernambuco" }];
    }
    if (sql.includes("ORDER BY i.nm_mun")) {
      return [{ cd_mun: 2611606, nm_mun: "Recife", sigla_uf: "PE" }];
    }
    if (sql.includes("AS atendidos")) return [SUMMARY_ROW];
    if (sql.includes("TRIM(p.porte)")) return PORTE_ROWS;
    if (sql.includes("TRIM(i.ride)")) return RIDE_ROWS;
    if (sql.includes("TRIM(i.semi_21)")) return SEMIARIDO_ROWS;
    if (sql.includes("ranqueadas")) return [HIGHLIGHT_ROW];
    if (sql.includes("AS ticket")) return [MAP_ROW];

    return [];
  }
}

const SUMMARY_ROW = {
  quantidade: "200",
  valor: "5000000.50",
  atendidos: "2",
  cs_qtd: "150",
  cs_valor: "4000000",
};

const PORTE_ROWS = [
  { label: "GRANDE", quantidade: "2", valor: "3000000" },
  { label: "MEDIO I", quantidade: "8", valor: "900000" },
  { label: "MINI", quantidade: "190", valor: "1100000.50" },
];

const RIDE_ROWS = [
  { label: null, quantidade: "120", valor: "1000000" },
  { label: "RIDE da Grande Teresina", quantidade: "80", valor: "4000000" },
];

const SEMIARIDO_ROWS = [{ label: "Sim", quantidade: "200", valor: "5000000" }];

const HIGHLIGHT_ROW = {
  cd_mun: 2611606,
  nm_mun: "Recife",
  sigla_uf: "PE",
  setor: "Comercio e Serviços",
  finalidade: "CAPITAL DE GIRO",
  programa: "FNE PNMPO",
  destaque: "90",
  total: "150",
};

const MAP_ROW = {
  cd_mun: 2611606,
  nm_mun: "Recife",
  sigla_uf: "PE",
  quantidade: "150",
  valor: "4500000",
  ticket: "30000",
};

const load = (db: FneDatabaseFake) =>
  loadFnePanel(db.query, {
    ano: 2025,
    visao: "quantidade",
    uf: "PE",
    muns: ["2611606", "2927408"],
  });

describe("loadFnePanel", () => {
  it("converts totals and computes the average ticket", async () => {
    const panel = await load(new FneDatabaseFake());

    expect(panel.totais).toEqual({
      quantidade: 200,
      valor: 5000000.5,
      ticketMedio: 25000.0025,
      municipiosAtendidos: 2,
    });
    expect(
      panel.setores.find((item) => item.label === "Comércio e serviços"),
    ).toEqual({
      label: "Comércio e serviços",
      quantidade: 150,
      valor: 4000000,
    });
  });

  it("keeps state and municipalities only when they exist in the selection", async () => {
    const panel = await load(new FneDatabaseFake());

    expect(panel.filters).toMatchObject({ uf: "PE", muns: ["2611606"] });
    expect(describeFneSelection(panel)).toBe("Recife (PE) · 2025");
    expect(
      describeFneSelection({
        ...panel,
        filters: { ...panel.filters, muns: ["2611606", "2607901"] },
      }),
    ).toBe("2 municípios · 2025");
  });

  it("orders portes from smallest to largest and names blank RIDEs", async () => {
    const panel = await load(new FneDatabaseFake());

    expect(panel.portes.map((item) => item.label)).toEqual([
      "Mini",
      "Médio I",
      "Grande",
    ]);
    expect(panel.rides[0].label).toBe("Fora de RIDE");
    expect(panel.semiarido[0].label).toBe("Semiárido");
  });

  it("ranks highlights by the metric of each tab", async () => {
    const db = new FneDatabaseFake();
    const panel = await load(db);

    expect(panel.destaques.quantidade[0]).toMatchObject({
      nome: "Recife",
      setor: "Comércio e serviços",
      total: 150,
      destaque: 90,
    });
    expect(db.calls.some(({ sql }) => sql.includes("SUM(p.valor_rs)"))).toBe(
      true,
    );
    expect(db.callFor("ranqueadas").params).toEqual([2025, "PE", [2611606]]);
  });
});

describe("toFneChartPoints", () => {
  it("picks the tab's metric and sorts only when asked", () => {
    const breakdowns = [
      { label: "A", quantidade: 1, valor: 30 },
      { label: "B", quantidade: 5, valor: 10 },
    ];

    expect(
      toFneChartPoints(breakdowns, "valor", { sorted: true })[0].label,
    ).toBe("A");
    expect(
      toFneChartPoints(breakdowns, "quantidade", { sorted: false }),
    ).toEqual([
      { label: "A", value: 1 },
      { label: "B", value: 5 },
    ]);
  });
});

describe("toFneLayeredRegions", () => {
  it("colours by the active metric and escapes the municipality name", () => {
    const [region] = toFneLayeredRegions(
      [
        {
          code: "2611606",
          name: "Recife <script>",
          uf: "PE",
          quantidade: 0,
          valor: 400000000,
          ticketMedio: 0,
        },
      ],
      "valor",
    );

    expect(region.color).toBe("#00441b");
    expect(region.tooltip).toContain("Recife &lt;script&gt;");
    expect(region.tooltip).toContain(
      "<strong>Valor contratado: R$ 400,00 mi</strong>",
    );
  });
});
