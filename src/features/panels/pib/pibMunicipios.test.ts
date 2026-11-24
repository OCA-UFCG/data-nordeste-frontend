import { describe, expect, it } from "vitest";
import { getBucket } from "@/features/panels/choropleth";
import {
  buildPibMunicipalTable,
  PIB_MUNICIPAL_BINS,
  pibMapFocus,
} from "@/features/panels/pib/pibMunicipios";

const binLabel = (value: number) => getBucket(PIB_MUNICIPAL_BINS, value).label;

describe("PIB_MUNICIPAL_BINS", () => {
  it("puts each break in the upper class", () => {
    expect(binLabel(25e6)).toBe("< R$ 50 Mi");
    expect(binLabel(50e6)).toBe("R$ 50 – 100 Mi");
    expect(binLabel(201.8e6)).toBe("R$ 100 – 250 Mi");
    expect(binLabel(250e6)).toBe("R$ 250 Mi – 1 Bi");
    expect(binLabel(1e9)).toBe("R$ 1 – 5 Bi");
    expect(binLabel(86.9e9)).toBe("> R$ 5 Bi");
  });
});

describe("PIB_MUNICIPAL_BINS limits", () => {
  it("sends max - 1 to its own bin and max to the next one, for every bin", () => {
    PIB_MUNICIPAL_BINS.slice(0, -1).forEach((bin, index) => {
      expect(getBucket(PIB_MUNICIPAL_BINS, bin.max - 1)).toBe(
        PIB_MUNICIPAL_BINS[index],
      );
      expect(getBucket(PIB_MUNICIPAL_BINS, bin.max)).toBe(
        PIB_MUNICIPAL_BINS[index + 1],
      );
    });
  });
});

describe("buildPibMunicipalTable", () => {
  it("lists municipalities by PIB, largest first, with value and class", () => {
    const table = buildPibMunicipalTable({
      filters: { ano: 2023, area: "nordeste" },
      mapa: [
        { code: "2504009", name: "Campina Grande", uf: "PB", value: 11.3e9 },
        { code: "2611606", name: "Recife", uf: "PE", value: 66.35e9 },
        { code: "2400208", name: "Açu", uf: "RN", value: 40e6 },
      ],
    });

    expect(table.caption).toBe("PIB total por município em 2023");
    expect(table.columns).toEqual(["Município", "PIB total", "Faixa"]);
    expect(table.rows).toEqual([
      ["Recife (PE)", "R$ 66,35 Bi", "> R$ 5 Bi"],
      ["Campina Grande (PB)", "R$ 11,30 Bi", "> R$ 5 Bi"],
      ["Açu (RN)", "R$ 40,00 Mi", "< R$ 50 Mi"],
    ]);
  });
});

describe("pibMapFocus", () => {
  it("highlights nothing without municipalities in the filter", () => {
    expect(pibMapFocus()).toEqual({});
    expect(pibMapFocus([])).toEqual({});
  });

  it("highlights and zooms into a single municipality", () => {
    const focus = pibMapFocus(["2611606"]);

    expect([...(focus.highlightCodes ?? [])]).toEqual(["2611606"]);
    expect(focus.selectedCode).toBe("2611606");
  });

  it("only highlights several municipalities, without zooming", () => {
    const focus = pibMapFocus(["2611606", "2507507"]);

    expect(focus.highlightCodes?.size).toBe(2);
    expect(focus.selectedCode).toBeUndefined();
  });
});
