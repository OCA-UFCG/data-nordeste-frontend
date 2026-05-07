import { describe, expect, it } from "vitest";
import { buildZenodoRecordsQuery, parseZenodoRecords } from "./zenodo";

describe("buildZenodoRecordsQuery", () => {
  it("builds the Zenodo community query with date and array filters", () => {
    const query = buildZenodoRecordsQuery(2, 6, {
      category: ["saude", "educacao"],
      date_gte: new Date("2024-01-01T00:00:00.000Z"),
      date_lte: new Date("2024-12-31T00:00:00.000Z"),
      sort: "mostrecent",
    });

    expect(query.get("communities")).toBe("datane");
    expect(query.get("page")).toBe("2");
    expect(query.get("size")).toBe("6");
    expect(query.get("sort")).toBe("mostrecent");
    expect(query.get("q")).toBe(
      'publication_date:[2024-01-01 TO 2024-12-31] AND ("saude" OR "educacao")',
    );
  });

  it("omits empty filters from the Zenodo query", () => {
    const query = buildZenodoRecordsQuery(1, 6, {
      category: [],
      sort: undefined,
    });

    expect(query.get("q")).toBeNull();
    expect(query.get("sort")).toBeNull();
  });
});

describe("parseZenodoRecords", () => {
  it("maps Zenodo records into catalog metadata", () => {
    const records = parseZenodoRecords({
      hits: {
        total: 1,
        hits: [
          {
            id: 123,
            created: "2025-01-15T00:00:00Z",
            metadata: {
              title: "Indicador regional",
              description: "<p>Resumo</p>",
              keywords: ["saude"],
              license: { id: "cc-by-4.0" },
            },
            links: {
              self_html: "https://zenodo.org/records/123",
            },
            files: [
              {
                key: "dados.csv",
                links: { self: "https://zenodo.org/api/files/dados.csv" },
              },
            ],
          },
        ],
      },
    });

    expect(records).toEqual([
      {
        id: "123",
        title: "Indicador regional",
        description: "<p>Resumo</p>",
        publication_date: "2025-01-15T00:00:00Z",
        version: "1.0",
        tags: ["saude"],
        html: "https://zenodo.org/records/123",
        license: "cc-by-4.0",
        files: [
          {
            name: "dados.csv",
            downloadUrl: "https://zenodo.org/api/files/dados.csv",
          },
        ],
      },
    ]);
  });
});
