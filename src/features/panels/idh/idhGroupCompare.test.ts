import { describe, expect, it } from "vitest";
import { compareIdhGroups } from "@/features/panels/idh/idhGroupCompare";
import type { IdhGroupSerie } from "@/features/panels/idh/idhPanel";

const point = (
  ano: number,
  idh: number,
  rendaPerCapita: number,
  rendimento = 900,
) => ({ ano, idh, gini: 0.55, rendaPerCapita, rendimento });

const SEXO: IdhGroupSerie[] = [
  {
    label: "Homem",
    serie: [point(2020, 0.66, 470), point(2021, 0.67, 484.43)],
  },
  { label: "Mulher", serie: [point(2021, 0.73, 451.44)] },
];

describe("compareIdhGroups", () => {
  it("states the second group's gap to the first in index points", () => {
    const comparison = compareIdhGroups(SEXO, 2021, "idh");

    expect(comparison).toEqual({
      values: [
        { label: "Homem", value: 0.67 },
        { label: "Mulher", value: 0.73 },
      ],
      max: 1,
      gap: "Mulher: +0,06 pontos em relação a Homem",
    });
  });

  it("uses the singular for a gap of one hundredth and no sign for none", () => {
    const groups = (a: number, b: number): IdhGroupSerie[] => [
      { label: "Branco", serie: [point(2021, a, 500)] },
      { label: "Negro", serie: [point(2021, b, 400)] },
    ];

    expect(compareIdhGroups(groups(0.7, 0.69), 2021, "idh").gap).toBe(
      "Negro: −0,01 ponto em relação a Branco",
    );
    expect(compareIdhGroups(groups(0.7, 0.7), 2021, "idh").gap).toBe(
      "Negro: 0,00 pontos em relação a Branco",
    );
  });

  it("states money gaps in percent and leaves 10% headroom on the scale", () => {
    const comparison = compareIdhGroups(SEXO, 2021, "rendaPerCapita");

    expect(comparison.gap).toBe("Mulher: −6,8% em relação a Homem");
    expect(comparison.max).toBe(600);
  });

  it("drops the gap when only one group has data in the year", () => {
    const comparison = compareIdhGroups(SEXO, 2020, "idh");

    expect(comparison.values).toEqual([{ label: "Homem", value: 0.66 }]);
    expect(comparison.gap).toBeUndefined();
  });
});
