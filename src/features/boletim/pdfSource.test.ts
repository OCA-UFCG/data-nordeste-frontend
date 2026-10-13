import { describe, expect, it } from "vitest";
import { resolvePdfDownloadUrl } from "./pdfSource";

const GOV_BR_FILE =
  "https://www.gov.br/sudene/pt-br/assuntos/boletins-tematicos/arquivos/boletim.pdf";

describe("boletim PDF download URL", () => {
  it("points gov.br file links at the Plone download view", () => {
    expect(resolvePdfDownloadUrl(GOV_BR_FILE)).toBe(
      `${GOV_BR_FILE}/@@download/file`,
    );
  });

  it("drops the trailing slash some Contentful links carry", () => {
    expect(resolvePdfDownloadUrl(`${GOV_BR_FILE}/`)).toBe(
      `${GOV_BR_FILE}/@@download/file`,
    );
  });

  it("keeps gov.br links that already target the download view", () => {
    const downloadUrl = `${GOV_BR_FILE}/@@download/file`;

    expect(resolvePdfDownloadUrl(downloadUrl)).toBe(downloadUrl);
  });

  it("keeps links from other hosts untouched", () => {
    const assetUrl = "https://images.ctfassets.net/space/boletim.pdf";

    expect(resolvePdfDownloadUrl(assetUrl)).toBe(assetUrl);
  });
});
