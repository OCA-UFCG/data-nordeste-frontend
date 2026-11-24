import { featureFilter } from "@maplibre/maplibre-gl-style-spec";
import type { FilterSpecification } from "maplibre-gl";
import { describe, expect, it } from "vitest";

import {
  chipHighlightFilter,
  classHighlightFilter,
  predominantClassFilter,
} from "@/features/panelMap/classHighlight";
import { countByClass } from "@/features/panelMap/classCounts";
import type {
  MapFeatureProps,
  QgisClass,
} from "@/features/panelMap/geodataTypes";

// WARNING: como no qgz, "Médio" vem com lower > upper e nunca casa; "Pequeno"
// e "Grande" se sobrepõem em (10 mil, 50 mil], que a cor dá ao Pequeno.
const DEMOGRAFIA_CLASSES: QgisClass[] = [
  { lower: 0, upper: 50000, label: "Pequeno", color: "#efcfdc" },
  { lower: 50000, upper: 10000, label: "Médio", color: "#e7a4bf" },
  { lower: 10000, upper: 4000000, label: "Grande", color: "#e482a9" },
];

function town(code: string, value?: number | string | null) {
  const props: MapFeatureProps = { code, name: code, uf: "PE" };

  if (value !== undefined) Object.assign(props, { v2022: value });

  return props;
}

const TOWNS = [
  town("zero", 0),
  town("medio-pela-faixa", 70000),
  town("sobreposto", 30000),
  town("grande", 120000),
  town("acima", 5000000),
  town("nulo", null),
  town("texto", "n/d"),
  town("ausente"),
];

// O avaliador de filtros do próprio MapLibre: a semântica é a do mapa.
function codesMatching(filter: FilterSpecification): string[] {
  const compiled = featureFilter(filter);

  return TOWNS.filter((properties) =>
    compiled.filter({ zoom: 5 }, { type: 3, properties, geometry: [] }),
  ).map(({ code }) => code);
}

describe("classHighlightFilter", () => {
  it("casa a 1ª classe com as bordas fechadas, incluindo a sobreposição", () => {
    const filter = classHighlightFilter(DEMOGRAFIA_CLASSES, 2022, 0);

    expect(codesMatching(filter)).toEqual(["zero", "sobreposto"]);
  });

  it("a classe invertida do qgz não casa nada", () => {
    const filter = classHighlightFilter(DEMOGRAFIA_CLASSES, 2022, 1);

    expect(codesMatching(filter)).toEqual([]);
  });

  it("deixa de fora o que a cor dá a uma classe anterior", () => {
    const filter = classHighlightFilter(DEMOGRAFIA_CLASSES, 2022, 2);

    expect(codesMatching(filter)).toEqual(["medio-pela-faixa", "grande"]);
  });

  it("nodata casa sem número, valor fora das classes e propriedade ausente", () => {
    const filter = classHighlightFilter(DEMOGRAFIA_CLASSES, 2022, "nodata");

    expect(codesMatching(filter)).toEqual([
      "acima",
      "nulo",
      "texto",
      "ausente",
    ]);
  });

  it("concorda com as contagens da legenda em cada classe", () => {
    const counts = countByClass(TOWNS, DEMOGRAFIA_CLASSES, 2022);
    const keys = [0, 1, 2, "nodata"] as const;
    const matched = keys.map(
      (key) =>
        codesMatching(classHighlightFilter(DEMOGRAFIA_CLASSES, 2022, key))
          .length,
    );

    expect(matched).toEqual(counts.map(({ count }) => count));
  });
});

describe("predominantClassFilter", () => {
  const classOf = new Map([
    ["2611606", 3],
    ["2611101", 2],
    ["2507507", 3],
  ]);

  it("casa os municípios cuja classe predominante é a da pílula", () => {
    expect(predominantClassFilter(classOf, 3)).toEqual([
      "in",
      ["get", "code"],
      ["literal", ["2611606", "2507507"]],
    ]);
  });

  it("classe sem município não casa nada", () => {
    expect(predominantClassFilter(classOf, 5)).toEqual([
      "in",
      ["get", "code"],
      ["literal", []],
    ]);
  });
});

describe("chipHighlightFilter", () => {
  const classes = { kind: "classes", classes: DEMOGRAFIA_CLASSES, ano: 2022 };
  const palette = [
    { value: 2, color: "#d7191b", label: "Árido" },
    { value: 3, color: "#fe7f00", label: "Semiárido" },
  ];

  it("a pílula depois das classes é o Sem dado", () => {
    expect(chipHighlightFilter({ ...classes, kind: "classes" }, 3)).toEqual(
      classHighlightFilter(DEMOGRAFIA_CLASSES, 2022, "nodata"),
    );
  });

  it("na aridez, a pílula vira o filtro da classe predominante", () => {
    const classOf = new Map([["2611606", 3]]);
    const source = { kind: "palette", palette, classOf } as const;

    expect(chipHighlightFilter(source, 1)).toEqual(
      predominantClassFilter(classOf, 3),
    );
  });

  it("na aridez sem classe por município, não destaca", () => {
    expect(chipHighlightFilter({ kind: "palette", palette }, 0)).toBeNull();
  });
});
