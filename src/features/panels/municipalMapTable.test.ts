import { describe, expect, it } from "vitest";
import { buildMunicipalMapTable } from "@/features/panels/municipalMapTable";

const BUCKETS = [
  { max: 10, label: "Baixo", color: "#fff" },
  { max: Infinity, label: "Alto", color: "#000" },
];

describe("buildMunicipalMapTable", () => {
  it("sorts by value and labels each row with its bucket", () => {
    const table = buildMunicipalMapTable(
      [
        { code: "1", name: "A", uf: "PE", value: 5 },
        { code: "2", name: "B", uf: "PB", value: 20 },
      ],
      {
        caption: "Teste",
        valueLabel: "Valor",
        bucketLabel: "Faixa",
        buckets: BUCKETS,
        formatValue: String,
      },
    );

    expect(table).toEqual({
      caption: "Teste",
      columns: ["Município", "Valor", "Faixa"],
      rows: [
        ["B (PB)", "20", "Alto"],
        ["A (PE)", "5", "Baixo"],
      ],
    });
  });
});
