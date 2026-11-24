import { describe, expect, it } from "vitest";

import { countByClass, paletteChips } from "@/features/panelMap/classCounts";
import type {
  MapFeatureProps,
  QgisClass,
} from "@/features/panelMap/geodataTypes";
import { NO_DATA_COLOR } from "@/features/panelMap/qgisPaint";

const CLASSES: QgisClass[] = [
  { lower: 0, upper: 10, label: "Pequeno", color: "#aaa" },
  { lower: 10, upper: 100, label: "Médio", color: "#bbb" },
  { lower: 100, upper: 1000, label: "Grande", color: "#ccc" },
];

function feature(code: string, value?: number | null): MapFeatureProps {
  const props: MapFeatureProps = { code, name: code, uf: "PE" };

  if (value !== undefined) props.v2023 = value;

  return props;
}

describe("countByClass", () => {
  it("conta as feições de cada classe, na ordem das classes", () => {
    const features = [feature("a", 5), feature("b", 50), feature("c", 7)];

    expect(countByClass(features, CLASSES, 2023)).toEqual([
      { label: "Pequeno", color: "#aaa", count: 2 },
      { label: "Médio", color: "#bbb", count: 1 },
      { label: "Grande", color: "#ccc", count: 0 },
    ]);
  });

  it("segue a borda do QGIS: a 1ª classe é fechada embaixo, as outras abertas", () => {
    const features = [feature("a", 0), feature("b", 10), feature("c", 1000)];
    const counts = countByClass(features, CLASSES, 2023).map((c) => c.count);

    expect(counts).toEqual([2, 0, 1]);
  });

  it("não mostra Sem dado quando todas as feições têm valor", () => {
    const labels = countByClass([feature("a", 5)], CLASSES, 2023).map(
      (item) => item.label,
    );

    expect(labels).not.toContain("Sem dado");
  });

  it("conta como Sem dado o ano ausente, o nulo e o fora das classes", () => {
    const features = [
      feature("a"),
      feature("b", null),
      feature("c", 5000),
      feature("d", 5),
    ];

    expect(countByClass(features, CLASSES, 2023).at(-1)).toEqual({
      label: "Sem dado",
      color: NO_DATA_COLOR,
      count: 3,
    });
  });

  it("classe invertida do qgz não casa nunca e fica com 0", () => {
    const inverted: QgisClass[] = [
      { lower: 0, upper: 10, label: "Baixo", color: "#aaa" },
      { lower: 100, upper: 10, label: "Invertido", color: "#bbb" },
    ];
    const counts = countByClass(
      [feature("a", 5), feature("b", 50)],
      inverted,
      2023,
    );

    expect(counts.map((item) => item.count)).toEqual([1, 0, 1]);
  });

  it("sem feições, todas as classes ficam com 0 e sem Sem dado", () => {
    expect(countByClass([], CLASSES, 2023).map((c) => c.count)).toEqual([
      0, 0, 0,
    ]);
  });
});

describe("paletteChips", () => {
  const palette = [
    { value: 2, color: "#d7191b", label: "Árido" },
    { value: 3, color: "#fe7f00", label: "Semiárido" },
  ];

  it("sem contagens, só rótulo e cor, na ordem da paleta", () => {
    expect(paletteChips(palette)).toEqual([
      { label: "Árido", color: "#d7191b" },
      { label: "Semiárido", color: "#fe7f00" },
    ]);
  });

  it("com contagens, cada classe leva a sua; a que falta fica 0", () => {
    expect(paletteChips(palette, new Map([[3, 120]]))).toEqual([
      { label: "Árido", color: "#d7191b", count: 0 },
      { label: "Semiárido", color: "#fe7f00", count: 120 },
    ]);
  });
});
