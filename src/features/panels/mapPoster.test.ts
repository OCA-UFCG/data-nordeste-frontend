import type { Feature, FeatureCollection } from "geojson";
import { describe, expect, it } from "vitest";
import { buildMapPosterSvg, POSTER_WIDTH } from "@/features/panels/mapPoster";
import type { MapPosterData } from "@/features/panels/mapPosterData";

const POLYGON: Feature = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-45, -10],
        [-35, -10],
        [-35, 0],
        [-45, 0],
        [-45, -10],
      ],
    ],
  },
};

const collection = (...features: Feature[]): FeatureCollection => ({
  type: "FeatureCollection",
  features,
});

const DATA: MapPosterData = {
  panelName: "Painel de Economia e Renda",
  icon: "usd",
  accent: "#e5640f",
  title: "Mapa do PIB - Nordeste",
  subtitle: "PIB total por município - 2021",
  chips: ["Ano: 2021", "Área: Nordeste", "Estado: Todos", "Município: Todos"],
  legend: [
    { color: "#fde6c8", label: "< R$ 50 Bi" },
    { color: "#7a2c0f", label: "> R$ 300 Bi" },
  ],
  inset: {
    label: "Recorte: Nordeste",
    context: collection(POLYGON),
    highlight: collection(POLYGON),
  },
  source: "Fonte: IBGE · Data Nordeste",
  updatedAt: "11/2026",
};

const MAP = { dataUrl: "data:image/png;base64,MAPA", width: 640, height: 480 };
const ASSETS = {
  logoDataUrl: "data:image/png;base64,LOGO",
  iconMarkup: '<path d="M0 0"/>',
};

const build = (data: Partial<MapPosterData> = {}, map = MAP) =>
  buildMapPosterSvg({ ...DATA, ...data }, map, ASSETS);

describe("buildMapPosterSvg", () => {
  it("writes the header, title, subtitle, chips and legend", () => {
    const { svg } = build();

    [
      "Painel de Economia e Renda",
      "Mapa do PIB - Nordeste",
      "PIB total por município - 2021",
      "Filtros aplicados",
      "Ano: 2021",
      "Município: Todos",
      "&lt; R$ 50 Bi",
      "&gt; R$ 300 Bi",
    ].forEach((text) => expect(svg).toContain(text));
  });

  it("draws the map image, the logo and the panel icon", () => {
    const { svg } = build();

    expect(svg).toContain("data:image/png;base64,MAPA");
    expect(svg).toContain("data:image/png;base64,LOGO");
    expect(svg).toContain('<path d="M0 0"/>');
  });

  it("writes the footer with source, update date and the site", () => {
    const { svg } = build();

    expect(svg).toContain("Fonte: IBGE · Data Nordeste");
    expect(svg).toContain("Atualizado em 11/2026");
    expect(svg).toContain("datanordeste.sudene.gov.br");
  });

  it("uses the site host it was given", () => {
    const { svg } = buildMapPosterSvg(DATA, MAP, {
      ...ASSETS,
      siteUrl: "exemplo.gov.br",
    });

    expect(svg).toContain("exemplo.gov.br");
  });

  it("leaves the update date out when the panel has none", () => {
    expect(build({ updatedAt: undefined }).svg).not.toContain("Atualizado em");
  });

  it("draws the recorte inset only when there is one", () => {
    expect(build().svg).toContain("Recorte: Nordeste");
    expect(build({ inset: null }).svg).not.toContain("Recorte");
  });

  it("escapes every text that comes from the panel", () => {
    const { svg } = build({ title: "A & <B>", chips: ['Estado: "X"'] });

    expect(svg).toContain("A &amp; &lt;B&gt;");
    expect(svg).toContain("Estado: &quot;X&quot;");
    expect(svg).not.toContain("<B>");
  });

  it("has a fixed width and a height that follows the map proportion", () => {
    const wide = build({}, { ...MAP, width: 800, height: 400 });
    const tall = build({}, { ...MAP, width: 400, height: 800 });

    expect(wide.width).toBe(POSTER_WIDTH);
    expect(tall.width).toBe(POSTER_WIDTH);
    expect(tall.height).toBeGreaterThan(wide.height);
    expect(wide.svg).toContain(`viewBox="0 0 ${POSTER_WIDTH} ${wide.height}"`);
  });

  it("wraps a long title into two lines instead of overflowing", () => {
    const short = build();
    const long = build({
      title: "Mapa do Índice de aridez por município - Pernambuco e Paraíba",
    });

    expect(long.height).toBeGreaterThan(short.height);
  });

  it("truncates a chip that is wider than the bar", () => {
    const { svg } = build({
      chips: [`Município: ${"Muito longo ".repeat(30)}`],
    });

    expect(svg).toContain("…");
  });

  it("wraps the chips and the legend into more rows when they do not fit", () => {
    const many = Array.from(
      { length: 12 },
      (_, i) => `Estado: Pernambuco ${i}`,
    );
    const legend = Array.from({ length: 12 }, (_, i) => ({
      color: "#999999",
      label: `R$ ${i} – ${i + 1} Bi`,
    }));

    expect(build({ chips: many }).height).toBeGreaterThan(build().height);
    expect(build({ legend }).height).toBeGreaterThan(build().height);
  });

  it("leaves the legend out when there are no classes", () => {
    expect(build({ legend: [] }).height).toBeLessThan(build().height);
  });

  it("throws with the value when the accent is not a #rrggbb color", () => {
    expect(() => build({ accent: "orange" })).toThrow('"orange"');
  });

  it("throws with the size when the map has no area", () => {
    expect(() => build({}, { ...MAP, width: 0 })).toThrow("0×480");
  });
});
