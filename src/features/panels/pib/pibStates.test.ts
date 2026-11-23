import { describe, expect, it } from "vitest";
import {
  buildPibStateLookup,
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
