import { describe, expect, it } from "vitest";

import { hoverLevelFor } from "@/features/panelMap/hoverLevel";
import { EMPTY_RECORTE } from "@/features/panelMap/mapRecorte";

describe("hoverLevelFor", () => {
  it("só com a área de interesse, o mapa municipal nomeia estados", () => {
    expect(hoverLevelFor("municipio", EMPTY_RECORTE)).toBe("estado");
  });

  it("com estado ou município escolhido, nomeia os municípios", () => {
    const pe = { uf: ["PE"], mun: [] };
    const recife = { uf: ["PE"], mun: ["2611606"] };

    expect(hoverLevelFor("municipio", pe)).toBe("feicao");
    expect(hoverLevelFor("municipio", recife)).toBe("feicao");
  });

  it("com feições de estado (IDH), sempre a própria feição", () => {
    expect(hoverLevelFor("estado", EMPTY_RECORTE)).toBe("feicao");
    expect(hoverLevelFor("estado", { uf: ["PE"], mun: [] })).toBe("feicao");
  });
});
