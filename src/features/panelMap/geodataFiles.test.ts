import { describe, expect, it } from "vitest";

import { featureFileFor } from "@/features/panelMap/geodataFiles";

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
