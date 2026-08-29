import { describe, expect, it } from "vitest";
import { absoluteUrl, buildDatasetJsonLd, siteUrl, SITE_NAME } from "./seo";

const baseRecord = {
  id: "12345",
  title: "Índice de Aridez do Semiárido",
  description: "<p>Série histórica de <strong>aridez</strong>.</p>",
  license: "cc-by-4.0",
  publication_date: "2024-03-01",
  html: "https://zenodo.org/records/12345",
  files: [
    { name: "dados.csv", downloadUrl: "https://zenodo.org/files/dados.csv" },
  ],
};

describe("buildDatasetJsonLd", () => {
  it("builds a schema.org Dataset with a known Creative Commons license", () => {
    const jsonLd = buildDatasetJsonLd(baseRecord);

    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@type"]).toBe("Dataset");
    expect(jsonLd.name).toBe(baseRecord.title);
    expect(jsonLd.description).toBe("Série histórica de aridez .");
    expect(jsonLd.url).toBe(absoluteUrl(`/catalog/${baseRecord.id}`));
    expect(jsonLd.sameAs).toBe(baseRecord.html);
    expect(jsonLd.datePublished).toBe(baseRecord.publication_date);
    expect(jsonLd.license).toBe("https://creativecommons.org/licenses/by/4.0/");
    expect(jsonLd.includedInDataCatalog).toEqual({
      "@type": "DataCatalog",
      "name": SITE_NAME,
      "url": siteUrl,
    });
  });

  it("omits the license field for an unmapped or unknown license id", () => {
    const jsonLd = buildDatasetJsonLd({
      ...baseRecord,
      license: "Desconhecida",
    });

    expect(jsonLd).not.toHaveProperty("license");
  });

  it("includes a DataDownload per file when the record has files", () => {
    const jsonLd = buildDatasetJsonLd({
      ...baseRecord,
      files: [
        {
          name: "dados.csv",
          downloadUrl: "https://zenodo.org/files/dados.csv",
        },
        {
          name: "dados.json",
          downloadUrl: "https://zenodo.org/files/dados.json",
        },
      ],
    });

    expect(jsonLd.distribution).toEqual([
      {
        "@type": "DataDownload",
        "name": "dados.csv",
        "contentUrl": "https://zenodo.org/files/dados.csv",
      },
      {
        "@type": "DataDownload",
        "name": "dados.json",
        "contentUrl": "https://zenodo.org/files/dados.json",
      },
    ]);
  });

  it("omits the distribution field when the record has no files", () => {
    const jsonLd = buildDatasetJsonLd({ ...baseRecord, files: [] });

    expect(jsonLd).not.toHaveProperty("distribution");
  });

  it("falls back to the site description when the record description is empty", () => {
    const jsonLd = buildDatasetJsonLd({ ...baseRecord, description: "" });

    expect(jsonLd.description).not.toBe("");
  });
});
