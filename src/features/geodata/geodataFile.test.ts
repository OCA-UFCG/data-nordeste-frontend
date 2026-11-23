import { describe, expect, it } from "vitest";
import { geodataEtag, resolveGeodataFile } from "./geodataFile";

describe("resolveGeodataFile", () => {
  it("resolves a geojson under the root", () => {
    expect(resolveGeodataFile("/g", ["vector", "pib.geojson"])).toEqual({
      absolutePath: "/g/vector/pib.geojson",
      contentType: "application/geo+json",
    });
  });

  it("types json and png files", () => {
    expect(resolveGeodataFile("/g", ["styles.json"])?.contentType).toBe(
      "application/json",
    );
    expect(
      resolveGeodataFile("/g", ["raster", "aridez_2020.png"])?.contentType,
    ).toBe("image/png");
  });

  it("matches the extension case-insensitively", () => {
    expect(resolveGeodataFile("/g", ["a.PNG"])?.contentType).toBe("image/png");
  });

  it.each([
    ["parent traversal", ["..", "etc", "passwd"]],
    ["traversal inside the path", ["vector", "..", "..", "x.json"]],
    ["extension outside the allow-list", ["vector", "a.js"]],
    ["no extension", ["vector", "a"]],
    ["no segments", []],
    ["empty segment", ["vector", "", "a.json"]],
    ["absolute segment", ["/abs.json"]],
    ["segment with a slash", ["vector/../a.json"]],
    ["segment with a backslash", ["vector\\a.json"]],
    ["segment with a NUL byte", ["a.json\0.png"]],
  ])("rejects %s", (_label, segments) => {
    expect(resolveGeodataFile("/g", segments)).toBeNull();
  });
});

describe("geodataEtag", () => {
  it("is a quoted weak-free validator built from size and mtime", () => {
    expect(geodataEtag(10, 1700000000000)).toBe('"10-1700000000000"');
  });

  it("changes when size or mtime changes", () => {
    expect(geodataEtag(10, 1)).not.toBe(geodataEtag(11, 1));
    expect(geodataEtag(10, 1)).not.toBe(geodataEtag(10, 2));
  });
});
