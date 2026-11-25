import { describe, expect, it } from "vitest";

import {
  featureLevelFor,
  recorteForLevel,
} from "@/features/panelMap/featureLevel";

describe("featureLevelFor", () => {
  it("o IDH é por estado; os outros indicadores, por município", () => {
    expect(featureLevelFor("idh")).toBe("estado");
    expect(featureLevelFor("demografia")).toBe("municipio");
    expect(featureLevelFor("pib")).toBe("municipio");
  });
});

describe("recorteForLevel", () => {
  const withMun = { uf: ["PE"], mun: ["2611606"] };

  it("no nível estado, o município escolhido vale pelo estado", () => {
    expect(recorteForLevel(withMun, "estado")).toEqual({
      uf: ["PE"],
      mun: [],
    });
  });

  it("no nível município, nada muda", () => {
    expect(recorteForLevel(withMun, "municipio")).toBe(withMun);
  });
});
