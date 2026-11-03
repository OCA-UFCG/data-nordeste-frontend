import { describe, expect, it } from "vitest";
import { escapeHtml, tooltipHtml } from "@/features/panels/chartBase";

describe("escapeHtml", () => {
  it("escapes tags, ampersands and double quotes", () => {
    expect(escapeHtml('<b title="x">Açu & Cia</b>')).toBe(
      "&lt;b title=&quot;x&quot;&gt;Açu &amp; Cia&lt;/b&gt;",
    );
  });
});

describe("tooltipHtml", () => {
  const blocks = (html: string) =>
    [...new DOMParser().parseFromString(html, "text/html").body.children].map(
      (element) => element.textContent,
    );

  it("stacks label, value and notes in that order", () => {
    expect(
      blocks(tooltipHtml("2021", "R$ 1,24 Tri", ["+8,2% em relação a 2020"])),
    ).toEqual(["2021", "R$ 1,24 Tri", "+8,2% em relação a 2020"]);
  });

  it("escapes every piece of text", () => {
    const html = tooltipHtml("<i>", "a & b", ['"nota"']);

    expect(html).toContain("&lt;i&gt;");
    expect(html).toContain("a &amp; b");
    expect(html).toContain("&quot;nota&quot;");
    expect(html).not.toContain("<i>");
  });
});
