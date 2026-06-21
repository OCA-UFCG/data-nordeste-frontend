import { describe, expect, it } from "vitest";
import {
  applyCatalogFilterLabels,
  buildCatalogTagViews,
  filterCatalogRecords,
  formatCatalogPublicationDate,
} from "./records";
import { MacroTheme } from "@/utils/interfaces";

const theme = {
  id: "saude",
  name: "Saúde",
  color: "#123456",
  sys: { id: "saude" },
  description: { json: { nodeType: "document", data: {}, content: [] } },
  article: { json: { nodeType: "document", data: {}, content: [] } },
  articleTitle: "",
  banner: { url: "" },
  tags: [],
} as MacroTheme;

describe("catalog records", () => {
  it("formats tag labels and colors from macrotheme aliases", () => {
    expect(buildCatalogTagViews(["Saúde"], [theme])).toEqual([
      { key: "saude-0", label: "Saúde", color: "#123456" },
    ]);
  });

  it("keeps invalid publication dates visible", () => {
    expect(formatCatalogPublicationDate("not-a-date")).toBe("not-a-date");
    expect(formatCatalogPublicationDate("2024-01-02T00:00:00.000Z")).toBe(
      "02/01/2024",
    );
  });

  it("applies Contentful filter labels to Zenodo tags", () => {
    const records = applyCatalogFilterLabels(
      [
        {
          id: "1",
          title: "Dataset",
          description: "",
          publication_date: "",
          version: "1",
          tags: ["saude"],
          html: "",
          license: "",
          files: [],
        },
      ],
      { saude: "Saúde" },
    );

    expect(records[0].tags).toEqual([{ slug: "saude", name: "Saúde" }]);
  });

  it("filters catalog records by their normalized theme tags", () => {
    const records = [
      {
        id: "1",
        title: "Imunização",
        description: "",
        publication_date: "2025-01-01",
        version: "1",
        tags: ["Saúde", "Excel"],
        html: "",
        license: "",
        files: [],
      },
      {
        id: "2",
        title: "Educação",
        description: "",
        publication_date: "2025-01-01",
        version: "1",
        tags: ["Educação"],
        html: "",
        license: "",
        files: [],
      },
    ];

    expect(
      filterCatalogRecords(
        records,
        { category: ["saude"] },
        {
          saude: "Saúde",
        },
      ).map((record) => record.title),
    ).toEqual(["Imunização"]);
  });
});
