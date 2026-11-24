import type { FeatureCollection } from "geojson";
import { describe, expect, it } from "vitest";

import type { MapFeatureProps } from "@/features/panelMap/geodataTypes";
import {
  featureProps,
  featuresInArea,
  recorteForClick,
} from "@/features/panelMap/mapSelection";

const RECIFE: MapFeatureProps = {
  code: "2611606",
  name: "Recife",
  uf: "PE",
  nordeste: 1,
  semiarido: 0,
};

const PETROLINA: MapFeatureProps = {
  code: "2611101",
  name: "Petrolina",
  uf: "PE",
  nordeste: 1,
  semiarido: 1,
};

const PERNAMBUCO: MapFeatureProps = {
  code: "PE",
  name: "Pernambuco (PE)",
  uf: "PE",
  nordeste: 1,
};

describe("recorteForClick", () => {
  it("no IDH a feição é o estado", () => {
    expect(recorteForClick(PERNAMBUCO, "idh", "estado")).toEqual({
      uf: ["PE"],
      mun: [],
    });
  });

  it("município clicado vira o filtro de município", () => {
    expect(recorteForClick(RECIFE, "pib", "municipio")).toEqual({
      uf: ["PE"],
      mun: ["2611606"],
    });
  });

  it("sem nível município, o clique escolhe o estado do município", () => {
    expect(recorteForClick(RECIFE, "demografia", "estado")).toEqual({
      uf: ["PE"],
      mun: [],
    });
  });
});

describe("featuresInArea", () => {
  it("municípios: só os marcados na área", () => {
    expect(featuresInArea([RECIFE, PETROLINA], "pib", "semiarido")).toEqual([
      PETROLINA,
    ]);
  });

  it("IDH: os estados todos, qualquer que seja a área", () => {
    expect(featuresInArea([PERNAMBUCO], "idh", "semiarido")).toEqual([
      PERNAMBUCO,
    ]);
  });
});

describe("featureProps", () => {
  it("devolve as propriedades das feições, na ordem do arquivo", () => {
    const collection: FeatureCollection = {
      type: "FeatureCollection",
      features: [RECIFE, PETROLINA].map((properties) => ({
        type: "Feature",
        properties,
        geometry: { type: "Point", coordinates: [0, 0] },
      })),
    };

    expect(featureProps(collection)).toEqual([RECIFE, PETROLINA]);
  });
});
