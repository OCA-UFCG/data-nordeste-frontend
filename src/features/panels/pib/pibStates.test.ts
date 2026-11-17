import { describe, expect, it } from "vitest";
import {
  buildPibStateLookup,
  describeStatesOffMap,
  pibStateBin,
} from "@/features/panels/pib/pibStates";

describe("pibStateBin", () => {
  it("puts each total in its band, with the limit in the upper one", () => {
    expect(pibStateBin(27e9).label).toBe("< R$ 50 Bi");
    expect(pibStateBin(50e9).label).toBe("R$ 50 – 100 Bi");
    expect(pibStateBin(232e9).label).toBe("R$ 200 – 300 Bi");
    expect(pibStateBin(431e9).color).toBe("#973815");
  });
});

describe("describeStatesOffMap", () => {
  const PE = { code: "PE", name: "Pernambuco", value: 270e9 };
  const MG = { code: "MG", name: "Minas Gerais", value: 43e9 };
  const ES = { code: "ES", name: "Espírito Santo", value: 2e9 };

  it("is null when every state is drawn", () => {
    expect(describeStatesOffMap([PE])).toBeNull();
  });

  it("names a single state in the singular", () => {
    expect(describeStatesOffMap([PE, MG])).toBe(
      "Minas Gerais integra a área, mas não aparece no mapa · selecione no filtro Estado.",
    );
  });

  it("joins several states in the plural", () => {
    expect(describeStatesOffMap([ES, MG, PE])).toBe(
      "Espírito Santo e Minas Gerais integram a área, mas não aparecem no mapa · selecione no filtro Estado.",
    );
  });
});

describe("buildPibStateLookup", () => {
  const lookup = buildPibStateLookup([
    { code: "PE", name: "Pernambuco", value: 232e9 },
  ]);

  it("colors, describes and lets pick a state of the area", () => {
    expect(lookup.binFor("PE")?.label).toBe("R$ 200 – 300 Bi");
    expect(lookup.describe("PE")).toMatch(/^Pernambuco, R\$/);
    expect(lookup.isSelectable("PE")).toBe(true);
  });

  it("has no band and cannot be picked outside the area", () => {
    expect(lookup.binFor("BA")).toBeNull();
    expect(lookup.describe("BA")).toBe("BA, fora da área");
    expect(lookup.isSelectable("BA")).toBe(false);
  });
});
