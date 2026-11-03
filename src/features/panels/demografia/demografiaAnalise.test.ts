import { describe, expect, it } from "vitest";
import {
  describeCorRaca,
  describePortes,
  formatShare,
} from "@/features/panels/demografia/demografiaAnalise";

const corRaca = (values: number[]) =>
  ["Amarela", "Branca", "Indígena", "Parda", "Preta"].map((label, index) => ({
    label,
    value: values[index],
  }));

const NORDESTE_2022 = corRaca([
  68_749, 14_571_557, 327_725, 32_559_846, 7_127_018,
]);
const NORDESTE_2010 = corRaca([
  631_009, 15_627_710, 208_691, 31_554_475, 5_058_802,
]);

describe("describeCorRaca", () => {
  it("names the two largest groups and the biggest rise and fall since the previous census", () => {
    expect(
      describeCorRaca(NORDESTE_2022, { ano: 2010, corRaca: NORDESTE_2010 }),
    ).toEqual([
      "A população se autodeclara majoritariamente Parda (59,6%), seguida por Branca (26,7%).",
      "Em comparação com 2010, houve um aumento de 57,0% na cor ou raça Indígena. Enquanto Amarela apresentou uma redução de 89,1%.",
    ]);
  });

  it("says when there is no previous census and drops the fall when nothing fell", () => {
    expect(describeCorRaca(NORDESTE_2010, null)[1]).toBe(
      "Não há ano anterior para comparação.",
    );
    expect(
      describeCorRaca(corRaca([2, 2, 2, 2, 2]), {
        ano: 2000,
        corRaca: corRaca([1, 2, 2, 2, 2]),
      })[1],
    ).toBe(
      "Em comparação com 2000, houve um aumento de 100,0% na cor ou raça Amarela.",
    );
  });
});

describe("describePortes", () => {
  it("counts municipalities by size, in the singular for one and skipping empty sizes", () => {
    expect(
      describePortes([
        { code: "2504009", label: "Campina Grande (PB)", value: 419_379 },
        { code: "2516201", label: "Sousa (PB)", value: 67_259 },
        { code: "2515302", label: "Sapé (PB)", value: 51_306 },
      ]),
    ).toEqual([
      "➡ Médio porte (50 mil - 100 mil hab.): 2 municípios.",
      "➡ Grande porte (acima de 100 mil hab.): 1 município.",
    ]);
  });
});

describe("formatShare", () => {
  it("formats the share of the total with one decimal, 0% without total", () => {
    expect(formatShare(28_240_713, 54_658_515)).toBe("51,7%");
    expect(formatShare(5, 0)).toBe("0,0%");
  });
});
