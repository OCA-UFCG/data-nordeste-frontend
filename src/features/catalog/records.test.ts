import { describe, expect, it } from "vitest";
import {
  applyCatalogFilterLabels,
  buildCatalogTagViews,
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
});
