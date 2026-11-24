import type { Feature, FeatureCollection } from "geojson";
import { vi } from "vitest";

import type {
  GeodataManifest,
  GeodataStyles,
  MapFeatureProps,
} from "@/features/panelMap/geodataTypes";

// Recortes mínimos dos geodados reais (styles.json, manifest.json, vector/*).

const OUTLINE = { color: "#666666", widthPx: 0.57 };

const PIB_CLASSES = [
  {
    lower: -190464340,
    upper: 500000000,
    label: "≤ R$ 500 Mi",
    color: "#fff7ed",
  },
  {
    lower: 500000000,
    upper: 90000000000,
    label: "> R$ 500 Mi",
    color: "#f79339",
  },
];

const IDH_CLASSES = [
  { lower: 0, upper: 0.7, label: "Até 0,7", color: "#ffbe20" },
  { lower: 0.7, upper: 1, label: "> 0,7", color: "#00bd47" },
];

export const STYLES_FIXTURE: GeodataStyles = {
  indicators: {
    pib: { attribute: "pib_2023", classes: PIB_CLASSES, outline: OUTLINE },
    demografia: {
      attribute: "pop_2022",
      classes: PIB_CLASSES,
      outline: OUTLINE,
    },
    idh: { attribute: "idh_2024", classes: IDH_CLASSES, outline: OUTLINE },
  },
  stateOutline: OUTLINE,
  aridez: [
    { value: 2, color: "#d7191b", label: "Árido" },
    { value: 3, color: "#fe7f00", label: "Semiárido" },
  ],
};

export const MANIFEST_FIXTURE: GeodataManifest = {
  generatedAt: "2026-11-23T23:13:19+00:00",
  years: { pib: [2022, 2023], demografia: [2022], idh: [2023, 2024] },
  aridez: {
    years: [1990, 2000, 2010, 2020],
    bounds: [
      [-48.7, -20.2],
      [-32.4, -1.1],
    ],
  },
};

type Ring = [number, number][];

function squareRing(west: number, south: number, size: number): Ring {
  const [east, north] = [west + size, south + size];

  return [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south],
  ];
}

function square(
  west: number,
  south: number,
  size: number,
  properties: object,
): Feature {
  const coordinates = [squareRing(west, south, size)];

  return {
    type: "Feature",
    properties: { ...properties },
    geometry: { type: "Polygon", coordinates },
  };
}

function collection(features: Feature[]): FeatureCollection {
  return { type: "FeatureCollection", features };
}

export const RECIFE: MapFeatureProps = {
  code: "2611606",
  name: "Recife",
  uf: "PE",
  nordeste: 1,
  semiarido: 0,
  v2023: 60000000000,
};

export const PETROLINA: MapFeatureProps = {
  code: "2611101",
  name: "Petrolina",
  uf: "PE",
  nordeste: 1,
  semiarido: 1,
  v2023: 9000000000,
};

export const JOAO_PESSOA: MapFeatureProps = {
  code: "2507507",
  name: "João Pessoa",
  uf: "PB",
  nordeste: 1,
  semiarido: 0,
  v2023: 28442131000,
};

export const PERNAMBUCO: MapFeatureProps = {
  code: "PE",
  name: "Pernambuco (PE)",
  uf: "PE",
  nordeste: 1,
  v2024: 0.72,
};

export const PARAIBA: MapFeatureProps = {
  code: "PB",
  name: "Paraíba (PB)",
  uf: "PB",
  nordeste: 1,
  v2024: 0.7,
};

const PIB_FIXTURE = collection([
  square(-35, -8.1, 0.1, RECIFE),
  square(-40.5, -9.4, 0.3, PETROLINA),
  square(-34.9, -7.2, 0.1, JOAO_PESSOA),
]);

const IDH_FIXTURE = collection([
  square(-41, -9.5, 6, PERNAMBUCO),
  square(-38.8, -8.3, 4, PARAIBA),
]);

const STATES_FIXTURE = collection([
  square(-41, -9.5, 6, { code: "PE", name: "Pernambuco", uf: "PE" }),
  square(-38.8, -8.3, 4, { code: "PB", name: "Paraíba", uf: "PB" }),
]);

const AREAS_FIXTURE = collection([
  square(-48, -18, 13, { area: "nordeste" }),
  square(-45, -16, 9, { area: "semiarido" }),
]);

const GEODATA_FIXTURES: Record<string, object> = {
  "/api/geodata/styles.json": STYLES_FIXTURE,
  "/api/geodata/manifest.json": MANIFEST_FIXTURE,
  "/api/geodata/vector/pib.geojson": PIB_FIXTURE,
  "/api/geodata/vector/demografia.geojson": PIB_FIXTURE,
  "/api/geodata/vector/idh.geojson": IDH_FIXTURE,
  "/api/geodata/vector/estados.geojson": STATES_FIXTURE,
  "/api/geodata/vector/areas.geojson": AREAS_FIXTURE,
};

/**
 * Rota `/api/geodata/*` de mentira. `failing` responde 503 em tudo, como um
 * ambiente sem GEODATA_DIR.
 *
 * @example vi.stubGlobal("fetch", new GeodataFetchFake().fetch)
 */
export class GeodataFetchFake {
  constructor(private readonly failing = false) {}

  readonly fetch = vi.fn(
    async (input: RequestInfo | URL): Promise<Response> => {
      const body = GEODATA_FIXTURES[String(input)];

      if (this.failing) return new Response("indisponível", { status: 503 });
      if (!body) return new Response("não encontrado", { status: 404 });

      return Response.json(body);
    },
  );
}
