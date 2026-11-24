import type { Feature, FeatureCollection } from "geojson";
import { describe, expect, it } from "vitest";

import {
  mapFeatureMode,
  recorteForLevel,
  STATE_MESH_FILL,
  STATE_MESH_FILL_SELECTED,
  stateMeshPaint,
  statesWithAreaFlags,
} from "@/features/panelMap/featureLevel";
import { STATE_OUTLINE_MIN_WIDTH_PX } from "@/features/panelMap/qgisPaint";
import type { GeodataStyles } from "@/features/panelMap/geodataTypes";

function collection(properties: object[]): FeatureCollection {
  const features = properties.map(
    (props): Feature => ({
      type: "Feature",
      properties: { ...props },
      geometry: { type: "Point", coordinates: [0, 0] },
    }),
  );

  return { type: "FeatureCollection", features };
}

const STATES = collection([
  { code: "PE", name: "Pernambuco", uf: "PE" },
  { code: "PB", name: "Paraíba", uf: "PB" },
  { code: "SP", name: "São Paulo", uf: "SP" },
]);

const MUNICIPIOS = collection([
  { code: "2611606", uf: "PE", nordeste: 1, semiarido: 0, sudene: 1 },
  { code: "2611101", uf: "PE", nordeste: 1, semiarido: 1, sudene: 1 },
  { code: "2507507", uf: "PB", nordeste: 1, semiarido: 0, sudene: 1 },
]);

const STATE_OUTLINE = { color: "#ffffff", widthPx: 1 };

describe("mapFeatureMode", () => {
  it("o IDH é sempre por estado, com os valores do indicador", () => {
    expect(mapFeatureMode("idh")).toEqual({
      level: "estado",
      stateMesh: false,
    });
    expect(mapFeatureMode("idh", "municipio")).toEqual({
      level: "estado",
      stateMesh: false,
    });
  });

  it("sem pedido, os outros indicadores são municipais", () => {
    expect(mapFeatureMode("demografia")).toEqual({
      level: "municipio",
      stateMesh: false,
    });
  });

  it("pedir estado troca os municípios pela malha dos estados", () => {
    expect(mapFeatureMode("demografia", "estado")).toEqual({
      level: "estado",
      stateMesh: true,
    });
  });
});

describe("statesWithAreaFlags", () => {
  const flagsOf = (code: string) =>
    statesWithAreaFlags(STATES, MUNICIPIOS).features.find(
      (state) => state.properties?.code === code,
    )?.properties;

  it("um estado está na área quando algum município dele está", () => {
    expect(flagsOf("PE")).toMatchObject({ nordeste: 1, semiarido: 1 });
    expect(flagsOf("PB")).toMatchObject({ nordeste: 1, semiarido: 0 });
  });

  it("estado sem município do indicador fica fora de todas as áreas", () => {
    expect(flagsOf("SP")).toMatchObject({
      nordeste: 0,
      semiarido: 0,
      caatinga: 0,
      sudene: 0,
    });
  });

  it("mantém as propriedades e a ordem dos estados", () => {
    const codes = statesWithAreaFlags(STATES, MUNICIPIOS).features.map(
      (state) => state.properties?.code,
    );

    expect(codes).toEqual(["PE", "PB", "SP"]);
    expect(flagsOf("PE")).toMatchObject({ name: "Pernambuco", uf: "PE" });
  });
});

describe("stateMeshPaint", () => {
  const styles = { stateOutline: STATE_OUTLINE } as GeodataStyles;

  it("os escolhidos ficam rosa forte e os outros rosa claro", () => {
    expect(stateMeshPaint(styles, ["PE"]).color).toEqual([
      "case",
      ["in", ["get", "code"], ["literal", ["PE"]]],
      STATE_MESH_FILL_SELECTED,
      STATE_MESH_FILL,
    ]);
    expect([STATE_MESH_FILL, STATE_MESH_FILL_SELECTED]).toEqual([
      "#f6d3e0",
      "#e98dae",
    ]);
  });

  it("o contorno das feições é o dos estados, com espessura mínima", () => {
    expect(stateMeshPaint(styles, []).outline).toEqual({
      color: "#ffffff",
      widthPx: STATE_OUTLINE_MIN_WIDTH_PX,
    });
  });
});

describe("recorteForLevel", () => {
  const withMun = { uf: ["PE"], mun: ["2611606"] };

  it("no nível estado, o município escolhido vale pelo estado", () => {
    expect(recorteForLevel(withMun, "estado")).toEqual({
      uf: ["PE"],
      mun: [],
    });
  });

  it("no nível município, nada muda", () => {
    expect(recorteForLevel(withMun, "municipio")).toBe(withMun);
  });
});
