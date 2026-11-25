import type { RasterSourceSpecification } from "maplibre-gl";
import { describe, expect, it } from "vitest";

import { basemapLayerId } from "@/lib/panelMap/basemaps";
import { panelMapOptions } from "@/lib/panelMap/panelMapOptions";

function rasterSource(
  options: ReturnType<typeof panelMapOptions>,
  id: string,
): RasterSourceSpecification {
  const style = options.style;

  if (typeof style !== "object" || !style) {
    throw new Error(`Expected an inline style object, got "${String(style)}".`);
  }

  return style.sources[id] as RasterSourceSpecification;
}

const cardOptions = (cooperative: boolean) => ({
  basemap: "padrao" as const,
  cooperative,
  municipal: true,
});

describe("panelMapOptions", () => {
  const container = document.createElement("div");

  it("liga os gestos cooperativos só quando pedido (card × tela cheia)", () => {
    expect(
      panelMapOptions(container, cardOptions(true)).cooperativeGestures,
    ).toBe(true);
    expect(
      panelMapOptions(container, cardOptions(false)).cooperativeGestures,
    ).toBe(false);
  });

  it("traduz o aviso dos gestos cooperativos", () => {
    const { locale } = panelMapOptions(container, cardOptions(true));

    expect(locale["CooperativeGesturesHandler.WindowsHelpText"]).toContain(
      "Ctrl",
    );
  });

  // O duplo clique interromperia o enquadramento do clique numa feição.
  it("desliga o zoom por duplo clique e o box zoom", () => {
    expect(panelMapOptions(container, cardOptions(false))).toMatchObject({
      doubleClickZoom: false,
      boxZoom: false,
    });
  });

  it("o Padrão usa os ladrilhos do OpenStreetMap, que vão até o nível 19", () => {
    const options = panelMapOptions(container, cardOptions(true));
    const padrao = rasterSource(options, basemapLayerId("padrao"));

    expect(padrao.tiles).toEqual([
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    ]);
    expect(padrao.attribution).toBe("© OpenStreetMap contributors");
    expect(padrao.maxzoom).toBe(19);
    expect(
      rasterSource(options, basemapLayerId("satelite")).maxzoom,
    ).toBeUndefined();
  });
});
