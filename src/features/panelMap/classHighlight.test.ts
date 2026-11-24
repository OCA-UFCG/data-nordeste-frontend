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

// Avaliador mínimo dos operadores que os filtros do destaque usam, com a
// semântica do MapLibre. WHY local: o avaliador do MapLibre
// (`@maplibre/maplibre-gl-style-spec`) é só dependência transitiva, e o
// `maplibre-gl` não o exporta. IMPORTANT: como no mapa, comparar com `<`,
// `<=`, `>` ou `>=` algo que não é número é erro de avaliação, e o filtro
// com erro não casa a feição.
type FeatureValues = Record<string, unknown>;
type Operator = (args: unknown[], props: FeatureValues) => unknown;

const numeric =
  (test: (left: number, right: number) => boolean): Operator =>
  (args, props) => {
    const [left, right] = args.map((arg) => evaluate(arg, props));

    if (typeof left !== "number" || typeof right !== "number") {
      throw new TypeError(
        `Comparison of "${String(left)}" and "${String(right)}" failed; expected two numbers.`,
      );
    }

    return test(left, right);
  };

// O `typeof` do MapLibre chama o ausente e o `null` de "null".
const typeName = (value: unknown) => (value === null ? "null" : typeof value);

const OPERATORS: Record<string, Operator> = {
  "get": ([key], props) => props[String(key)] ?? null,
  "literal": ([value]) => value,
  "typeof": ([arg], props) => typeName(evaluate(arg, props)),
  "in": ([needle, list], props) =>
    (evaluate(list, props) as unknown[]).includes(evaluate(needle, props)),
  "!": ([arg], props) => !evaluate(arg, props),
  "all": (args, props) => args.every((arg) => evaluate(arg, props)),
  "any": (args, props) => args.some((arg) => evaluate(arg, props)),
  "==": ([left, right], props) =>
    evaluate(left, props) === evaluate(right, props),
  "<=": numeric((left, right) => left <= right),
  ">": numeric((left, right) => left > right),
  ">=": numeric((left, right) => left >= right),
};

function evaluate(expression: unknown, props: FeatureValues): unknown {
  if (!Array.isArray(expression)) return expression;
  const [name, ...args] = expression;
  const operator = OPERATORS[String(name)];

  if (!operator) {
    throw new Error(
      `Operator "${String(name)}" is not supported by the test evaluator; expected one of ${Object.keys(OPERATORS).join(", ")}.`,
    );
  }

  return operator(args, props);
}

function matches(filter: FilterSpecification, props: FeatureValues): boolean {
  try {
    return evaluate(filter, props) === true;
  } catch (error) {
    if (error instanceof TypeError) return false;
    throw error;
  }
}

function codesMatching(filter: FilterSpecification): string[] {
  return TOWNS.filter((town) => matches(filter, town)).map(({ code }) => code);
}

describe("avaliador de teste", () => {
  it("comparar o que não é número não casa, como no MapLibre", () => {
    const filter: FilterSpecification = [">=", ["get", "v2022"], 0];

    expect(matches(filter, { v2022: null })).toBe(false);
    expect(matches(filter, { v2022: "n/d" })).toBe(false);
    expect(matches(filter, { v2022: 3 })).toBe(true);
  });
});

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
