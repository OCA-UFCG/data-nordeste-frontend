import type { Feature, FeatureCollection, Polygon } from "geojson";
import { describe, expect, it } from "vitest";
import type { GeodataStyles } from "@/features/panelMap/geodataTypes";
import {
  buildMapPoster,
  type MapPosterBase,
  type MapPosterCardInput,
  type PosterGeodata,
  posterPlace,
} from "@/features/panels/mapPosterBuild";
import { NO_YEAR } from "@/features/panels/territorialFilters";
import type { TerritorialSelection } from "@/features/panels/territorialOptions";

const square = (properties: Record<string, unknown>): Feature<Polygon> => ({
  type: "Feature",
  properties,
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ],
  },
});

const collection = (features: Feature[]): FeatureCollection => ({
  type: "FeatureCollection",
  features,
});

const OUTLINE = { color: "#666", widthPx: 0.5 };
const PIB_CLASSES = [
  { lower: 0, upper: 100, label: "< R$ 50 Bi", color: "#fff7ed" },
  { lower: 100, upper: 1000, label: "> R$ 50 Bi", color: "#f79339" },
];

const STYLES: GeodataStyles = {
  indicators: {
    pib: { attribute: "pib", classes: PIB_CLASSES, outline: OUTLINE },
    demografia: { attribute: "pop", classes: PIB_CLASSES, outline: OUTLINE },
    idh: { attribute: "idh", classes: PIB_CLASSES, outline: OUTLINE },
  },
  stateOutline: OUTLINE,
  aridez: [
    { value: 2, color: "#d7191b", label: "Árido" },
    { value: 3, color: "#fe7f00", label: "Semiárido" },
  ],
};

// Dois municípios na área (um sem valor no ano), dois estados e as áreas.
const GEODATA: PosterGeodata = {
  styles: STYLES,
  features: collection([
    square({ code: "2611606", uf: "PE", nordeste: 1, v2021: 50 }),
    square({ code: "2507507", uf: "PB", nordeste: 1, v2021: null }),
  ]),
  states: collection([square({ code: "PE" }), square({ code: "PB" })]),
  areas: collection([
    square({ area: "nordeste" }),
    square({ area: "semiarido" }),
  ]),
};

const BASE: MapPosterBase = {
  panelName: "Painel de Economia e Renda",
  icon: "usd",
  accent: "#e5640f",
  updatedAt: "11/2026",
  place: "Nordeste",
  chips: ["Ano: 2021", "Área: Nordeste", "Estado: Todos", "Município: Todos"],
};

const PIB_INPUT: MapPosterCardInput = {
  name: "PIB",
  subtitle: "PIB total por município",
  source: "Fonte: IBGE · Data Nordeste",
  indicator: "pib",
  area: "nordeste",
  ano: 2021,
  recorte: { uf: [], mun: [] },
  geodata: GEODATA,
};

const selection = (
  filters: TerritorialSelection["filters"],
): TerritorialSelection => ({
  filters,
  ufs: [
    { sigla: "PE", nome: "Pernambuco" },
    { sigla: "PB", nome: "Paraíba" },
  ],
  municipios: [{ cdMun: "2611606", nome: "Recife (PE)" }],
});

describe("posterPlace", () => {
  it("names the area when nothing else is chosen", () => {
    expect(posterPlace(selection({ ano: 2021, area: "nordeste" }))).toBe(
      "Nordeste",
    );
  });

  it("names the state over the area", () => {
    expect(
      posterPlace(selection({ ano: 2021, area: "nordeste", uf: ["PE"] })),
    ).toBe("Pernambuco");
  });

  it("names the municipality over the state and the area", () => {
    expect(
      posterPlace(
        selection({
          ano: 2021,
          area: "nordeste",
          uf: ["PE"],
          mun: ["2611606"],
        }),
      ),
    ).toBe("Recife (PE)");
  });
});

describe("buildMapPoster", () => {
  it("builds the PIB poster texts like the template", () => {
    const poster = buildMapPoster(BASE, PIB_INPUT);

    expect(poster).toMatchObject({
      panelName: "Painel de Economia e Renda",
      icon: "usd",
      accent: "#e5640f",
      title: "Mapa do PIB - Nordeste",
      subtitle: "PIB total por município - 2021",
      chips: BASE.chips,
      source: "Fonte: IBGE · Data Nordeste",
      updatedAt: "11/2026",
    });
  });

  it("titles the poster with the place and the indicator of each panel", () => {
    const place = { ...BASE, place: "Pernambuco" };
    const titleOf = (input: Partial<MapPosterCardInput>) =>
      buildMapPoster(place, { ...PIB_INPUT, ...input }).title;

    expect(titleOf({ name: "Porte populacional" })).toBe(
      "Mapa do Porte populacional - Pernambuco",
    );
    expect(titleOf({ name: "IDH" })).toBe("Mapa do IDH - Pernambuco");
    expect(titleOf({ name: "Índice de aridez" })).toBe(
      "Mapa do Índice de aridez - Pernambuco",
    );
  });

  it("leaves the year out of the subtitle when the panel has none", () => {
    const poster = buildMapPoster(BASE, { ...PIB_INPUT, ano: NO_YEAR });

    expect(poster.subtitle).toBe("PIB total por município");
  });

  it("omits the date when the panel has none", () => {
    const poster = buildMapPoster({ ...BASE, updatedAt: undefined }, PIB_INPUT);

    expect(poster.updatedAt).toBeUndefined();
  });

  it("lists the legend classes without counts, ending with 'Sem dado'", () => {
    const { legend } = buildMapPoster(BASE, PIB_INPUT);

    expect(legend.map((item) => item.label)).toEqual([
      "< R$ 50 Bi",
      "> R$ 50 Bi",
      "Sem dado",
    ]);
    expect(legend[0]).toStrictEqual({ color: "#fff7ed", label: "< R$ 50 Bi" });
  });

  it("uses the aridez palette for the aridez legend", () => {
    const { legend } = buildMapPoster(BASE, {
      ...PIB_INPUT,
      indicator: "aridez",
    });

    expect(legend).toStrictEqual([
      { color: "#d7191b", label: "Árido" },
      { color: "#fe7f00", label: "Semiárido" },
    ]);
  });

  it("comes out without legend and inset while the geodata is loading", () => {
    const poster = buildMapPoster(BASE, { ...PIB_INPUT, geodata: null });

    expect(poster.legend).toEqual([]);
    expect(poster.inset).toBeNull();
    expect(poster.title).toBe("Mapa do PIB - Nordeste");
  });
});

describe("poster inset", () => {
  const insetOf = (recorte: MapPosterCardInput["recorte"], place: string) =>
    buildMapPoster({ ...BASE, place }, { ...PIB_INPUT, recorte }).inset;
  const codes = (collection: FeatureCollection | undefined, key: string) =>
    collection?.features.map((feature) => feature.properties?.[key]);

  it("highlights the area outline with every state behind it", () => {
    const inset = insetOf({ uf: [], mun: [] }, "Nordeste");

    expect(inset?.label).toBe("Recorte: Nordeste");
    expect(codes(inset?.highlight, "area")).toEqual(["nordeste"]);
    expect(codes(inset?.context, "code")).toEqual(["PE", "PB"]);
  });

  it("highlights the chosen state", () => {
    const inset = insetOf({ uf: ["PE"], mun: [] }, "Pernambuco");

    expect(inset?.label).toBe("Recorte: Pernambuco");
    expect(codes(inset?.highlight, "code")).toEqual(["PE"]);
  });

  it("highlights the chosen municipality over its state", () => {
    const inset = insetOf({ uf: ["PE"], mun: ["2611606"] }, "Recife (PE)");

    expect(codes(inset?.highlight, "code")).toEqual(["2611606"]);
  });
});
