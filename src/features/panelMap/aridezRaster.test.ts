import { describe, expect, it } from "vitest";

import {
  aridezModeFor,
  aridezRasterYear,
} from "@/features/panelMap/aridezRaster";

const DECADES = [1990, 2000, 2010, 2020];

describe("aridezRasterYear", () => {
  it.each([
    [1991, 1990],
    [2001, 2000],
    [2011, 2010],
    [2021, 2020],
  ])("o ano %i usa o raster de %i", (ano, decade) => {
    expect(aridezRasterYear(DECADES, ano)).toBe(decade);
  });

  it("o ano da própria década usa a década", () => {
    expect(aridezRasterYear(DECADES, 2010)).toBe(2010);
  });

  it("depois da última década fica com a última", () => {
    expect(aridezRasterYear(DECADES, 2035)).toBe(2020);
  });

  it("não depende da ordem do manifest", () => {
    expect(aridezRasterYear([2020, 1990, 2010], 2015)).toBe(2010);
  });

  it("antes da primeira década não há raster", () => {
    expect(aridezRasterYear(DECADES, 1989)).toBeNull();
    expect(aridezRasterYear([], 2020)).toBeNull();
  });
});

describe("aridezModeFor", () => {
  it("o mapa da aridez nasce com o raster", () => {
    expect(aridezModeFor("aridez")).toBe("base");
  });

  it("os outros mapas nascem sem", () => {
    expect(aridezModeFor("pib")).toBe("off");
    expect(aridezModeFor("idh")).toBe("off");
  });

  it("o modo dito pelo painel vale", () => {
    expect(aridezModeFor("aridez", "off")).toBe("off");
    expect(aridezModeFor("demografia", "base")).toBe("base");
  });
});
