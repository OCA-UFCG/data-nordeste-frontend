import { describe, expect, it } from "vitest";
import { hasPdfSignature, parseAllowedPdfUrl } from "./pdfSource";

describe("parseAllowedPdfUrl", () => {
  it.each([
    [
      "a boletim PDF on www.gov.br",
      "https://www.gov.br/sudene/pt-br/assuntos/boletins-tematicos/arquivos/boletim.pdf/@@display-file/file",
    ],
    [
      "the Google Drive download link",
      "https://drive.google.com/uc?export=download&id=abc",
    ],
    [
      "the Google Drive download redirect target",
      "https://drive.usercontent.google.com/download?id=abc&export=download",
    ],
  ])("accepts %s", (_case, rawUrl) => {
    expect(parseAllowedPdfUrl(rawUrl)).not.toBeNull();
  });

  it.each([
    [
      "a link-local metadata address",
      "http://169.254.169.254/latest/meta-data/",
    ],
    ["plain http on the allowed host", "http://www.gov.br/sudene/boletim.pdf"],
    ["a lookalike host", "https://www.gov.br.evil.example/boletim.pdf"],
    ["credentials pointing elsewhere", "https://www.gov.br@evil.example/x.pdf"],
    ["an internal service", "http://internal-service:8000/"],
    ["something that is not a URL", "not a url"],
  ])("rejects %s", (_case, rawUrl) => {
    expect(parseAllowedPdfUrl(rawUrl)).toBeNull();
  });
});

describe("hasPdfSignature", () => {
  const encode = (text: string) => new TextEncoder().encode(text);

  it("recognizes a PDF by its first bytes", () => {
    expect(hasPdfSignature(encode("%PDF-1.7\n..."))).toBe(true);
  });

  it.each([
    ["an HTML page", "<!doctype html><html>"],
    ["an empty body", ""],
  ])("rejects %s", (_case, body) => {
    expect(hasPdfSignature(encode(body))).toBe(false);
  });
});
