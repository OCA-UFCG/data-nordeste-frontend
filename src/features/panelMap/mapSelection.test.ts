import type { FeatureCollection } from "geojson";
import { describe, expect, it } from "vitest";

import type { MapFeatureProps } from "@/features/panelMap/geodataTypes";
import { EMPTY_RECORTE } from "@/features/panelMap/mapRecorte";
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
  it("com feições de estado (IDH, Estados) a feição é o estado", () => {
    expect(
      recorteForClick(PERNAMBUCO, "estado", "estado", EMPTY_RECORTE),
    ).toEqual({
      uf: ["PE"],
      mun: [],
    });
  });

  it("município clicado vira o filtro de município", () => {
    expect(
      recorteForClick(RECIFE, "municipio", "municipio", EMPTY_RECORTE),
    ).toEqual({
      uf: ["PE"],
      mun: ["2611606"],
    });
  });

  it("sem nível município, o clique escolhe o estado do município", () => {
    expect(
      recorteForClick(RECIFE, "municipio", "estado", EMPTY_RECORTE),
    ).toEqual({
      uf: ["PE"],
      mun: [],
    });
  });
  it("município já escolhido: o clique volta ao estado", () => {
    const current = { uf: ["PE"], mun: ["2611606"] };

    expect(recorteForClick(RECIFE, "municipio", "municipio", current)).toEqual({
      uf: ["PE"],
      mun: [],
    });
  });

  it("estado já escolhido (feições de estado): o clique volta à área", () => {
    const current = { uf: ["PE"], mun: [] };

    expect(recorteForClick(PERNAMBUCO, "estado", "estado", current)).toEqual(
      EMPTY_RECORTE,
    );
  });

  it("sem nível município, clicar no estado já escolhido volta à área", () => {
    const current = { uf: ["PE"], mun: [] };

    expect(recorteForClick(RECIFE, "municipio", "estado", current)).toEqual(
      EMPTY_RECORTE,
    );
  });

  it("outro município do mesmo estado é escolhido, sem voltar nível", () => {
    const current = { uf: ["PE"], mun: ["2611606"] };

    expect(
      recorteForClick(PETROLINA, "municipio", "municipio", current),
    ).toEqual({ uf: ["PE"], mun: ["2611101"] });
  });

  it("um de vários municípios selecionados: escolhe só ele", () => {
    const current = { uf: ["PE"], mun: ["2611606", "2611101"] };

    expect(recorteForClick(RECIFE, "municipio", "municipio", current)).toEqual({
      uf: ["PE"],
      mun: ["2611606"],
    });
  });

  it("um de vários estados selecionados: escolhe só ele", () => {
    const current = { uf: ["PE", "PB"], mun: [] };

    expect(recorteForClick(PERNAMBUCO, "estado", "estado", current)).toEqual({
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
