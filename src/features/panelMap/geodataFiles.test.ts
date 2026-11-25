import { describe, expect, it } from "vitest";

import {
  areaStatesFileFor,
  areaStatesOutsideFileFor,
  featureFileFor,
} from "@/features/panelMap/geodataFiles";

describe("featureFileFor", () => {
  it.each(["pib", "demografia", "idh"] as const)(
    "%s lê o GeoJSON do próprio indicador",
    (indicator) => {
      expect(featureFileFor(indicator)).toBe(`vector/${indicator}.geojson`);
    },
  );

  it("a aridez lê a malha municipal sem valores", () => {
    expect(featureFileFor("aridez")).toBe("vector/municipios.geojson");
  });
});

describe("areaStatesFileFor", () => {
  it.each(["nordeste", "semiarido", "caatinga", "sudene"] as const)(
    "%s lê os estados recortados pela própria área",
    (area) => {
      expect(areaStatesFileFor(area)).toBe(`vector/estados_${area}.geojson`);
    },
  );

  it("a parte de fora da área tem arquivo próprio", () => {
    expect(areaStatesOutsideFileFor("sudene")).toBe(
      "vector/estados_fora_sudene.geojson",
    );
  });
});
