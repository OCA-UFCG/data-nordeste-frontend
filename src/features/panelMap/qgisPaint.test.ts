import { describe, expect, it } from "vitest";

import {
  NO_DATA_COLOR,
  classColorExpression,
  classForValue,
  featurePaint,
  indicatorFillColor,
  TRANSPARENT_FILL,
  yearField,
} from "@/features/panelMap/qgisPaint";
import type {
  GeodataStyles,
  QgisClass,
} from "@/features/panelMap/geodataTypes";

// Classes de styles.json como vieram do qgz (PIB: 7 classes).
const PIB_CLASSES: QgisClass[] = [
  {
    lower: -190464340,
    upper: 500000000,
    label: "≤ R$ 500 Mi",
    color: "#fff7ed",
  },
  {
    lower: 500000000,
    upper: 1000000000,
    label: "> R$ 500 Mi - R$ 1 Bi",
    color: "#fcd9ac",
  },
  {
    lower: 1000000000,
    upper: 5000000000,
    label: "> R$ 1 Bi - R$ 5 Bi",
    color: "#f79339",
  },
  {
    lower: 5000000000,
    upper: 10000000000,
    label: "> R$ 5 Bi - R$ 10 Bi",
    color: "#e65e10",
  },
  {
    lower: 10000000000,
    upper: 20000000000,
    label: "> R$ 10 Bi - R$ 20 Bi",
    color: "#be4610",
  },
  {
    lower: 20000000000,
    upper: 35000000000,
    label: "> R$ 20 Bi - R$ 35 Bi",
    color: "#7a3014",
  },
  {
    lower: 35000000000,
    upper: 90000000000,
    label: "> R$ 35 Bi",
    color: "#421608",
  },
];

// WARNING: o qgz traz a classe "Médio" com lower > upper; é reproduzida como veio
// e simplesmente nunca casa (dados não são corrigidos).
const DEMOGRAFIA_CLASSES: QgisClass[] = [
  {
    lower: 0,
    upper: 50000,
    label: "Pequeno (≤ 50 mil habitantes)",
    color: "#efcfdc",
  },
  {
    lower: 50000,
    upper: 10000,
    label: "Médio (> 50 mil e ≤ 100 mil habitantes)",
    color: "#e7a4bf",
  },
  {
    lower: 10000,
    upper: 4000000,
    label: "Grande (≥ 100 mil habitantes)",
    color: "#e482a9",
  },
];

describe("yearField", () => {
  it("builds the feature property name of a year", () => {
    expect(yearField(2023)).toBe("v2023");
  });
});

describe("classForValue", () => {
  it("picks the last PIB class for a value above 35 Bi", () => {
    expect(classForValue(PIB_CLASSES, 66351305000)?.label).toBe("> R$ 35 Bi");
  });

  it("keeps the upper bound of the first class inclusive", () => {
    expect(classForValue(PIB_CLASSES, 500000000)).toBe(PIB_CLASSES[0]);
  });

  it("keeps the lower bound of the first class inclusive", () => {
    expect(classForValue(PIB_CLASSES, -190464340)).toBe(PIB_CLASSES[0]);
  });

  it("makes the lower bound of later classes exclusive", () => {
    expect(classForValue(PIB_CLASSES, 1000000000)).toBe(PIB_CLASSES[1]);
  });

  it("returns null for a value outside every class", () => {
    expect(classForValue(PIB_CLASSES, 90000000001)).toBeNull();
    expect(classForValue(PIB_CLASSES, -190464341)).toBeNull();
  });

  it("returns null when there is no value", () => {
    expect(classForValue(PIB_CLASSES, null)).toBeNull();
  });

  it("reproduces the inverted demografia class as-is: it never matches", () => {
    expect(classForValue(DEMOGRAFIA_CLASSES, 70000)?.label).toBe(
      "Grande (≥ 100 mil habitantes)",
    );

    const hits = [0, 1, 10000, 50000, 50001, 70000, 99999, 4000000].map(
      (value) => classForValue(DEMOGRAFIA_CLASSES, value)?.label,
    );

    expect(hits.some((label) => label?.startsWith("Médio"))).toBe(false);
  });
});

describe("classColorExpression", () => {
  const expression = classColorExpression(PIB_CLASSES, 2023) as unknown[];

  it("starts with case and sends missing or non-number values to NO_DATA_COLOR", () => {
    expect(expression[0]).toBe("case");
    expect(expression[1]).toEqual([
      "!",
      ["==", ["typeof", ["get", "v2023"]], "number"],
    ]);
    expect(expression[2]).toBe(NO_DATA_COLOR);
  });

  it("ends with the NO_DATA_COLOR fallback", () => {
    expect(expression[expression.length - 1]).toBe(NO_DATA_COLOR);
  });

  it("emits one condition/color pair per class, in file order", () => {
    const colors = expression
      .slice(3, -1)
      .filter((_, index) => index % 2 === 1);

    expect(colors).toEqual(PIB_CLASSES.map((item) => item.color));
  });

  it("uses closed-closed for the first class and open-closed for the others", () => {
    expect(expression[3]).toEqual([
      "all",
      [">=", ["get", "v2023"], -190464340],
      ["<=", ["get", "v2023"], 500000000],
    ]);
    expect(expression[5]).toEqual([
      "all",
      [">", ["get", "v2023"], 500000000],
      ["<=", ["get", "v2023"], 1000000000],
    ]);
  });
});

describe("indicatorFillColor", () => {
  const classes: QgisClass[] = [
    { lower: 0, upper: 10, label: "Baixo", color: "#fff" },
  ];

  it("usa as classes do ano sem raster por baixo", () => {
    expect(indicatorFillColor(classes, 2023, false)).toEqual(
      classColorExpression(classes, 2023),
    );
  });

  it("fica transparente com o raster como camada principal", () => {
    expect(indicatorFillColor(classes, 2023, true)).toEqual(TRANSPARENT_FILL);
  });
});

describe("featurePaint", () => {
  const classes: QgisClass[] = [
    { lower: 0, upper: 10, label: "Baixo", color: "#fff" },
  ];
  const pibOutline = { color: "#111111", widthPx: 0.5 };
  const stateOutline = { color: "#666666", widthPx: 0.57 };
  const pib = { attribute: "pib_2023", classes, outline: pibOutline };
  const styles: GeodataStyles = {
    indicators: { pib, demografia: pib, idh: pib },
    stateOutline,
    aridez: [],
  };

  it("pinta as classes do ano com o contorno do qgz do indicador", () => {
    expect(featurePaint(styles, "pib", 2023, false)).toEqual({
      color: classColorExpression(classes, 2023),
      outline: pibOutline,
    });
  });

  it("a aridez fica transparente com o contorno dos estados", () => {
    expect(featurePaint(styles, "aridez", 2021, true)).toEqual({
      color: TRANSPARENT_FILL,
      outline: stateOutline,
    });
  });
});
