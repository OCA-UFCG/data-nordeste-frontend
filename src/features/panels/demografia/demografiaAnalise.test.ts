import { describe, expect, it } from "vitest";
import { describeDemografia } from "@/features/panels/demografia/demografiaAnalise";

describe("describeDemografia", () => {
  it("summarizes growth, sex, age and race from the panel numbers", () => {
    expect(
      describeDemografia({
        filters: { ano: 2022, area: "nordeste" },
        serie: [
          { label: "2010", value: 53_081_950 },
          { label: "2022", value: 54_658_515 },
        ],
        sexo: { mulheres: 28_240_713, homens: 26_417_802 },
        piramide: [
          { faixa: "0 a 9 anos", mulheres: 3_690_179, homens: 3_828_504 },
          { faixa: "30 a 39 anos", mulheres: 4_446_912, homens: 4_060_504 },
        ],
        corRaca: [
          { label: "Parda", value: 32_559_846 },
          { label: "Branca", value: 14_571_557 },
        ],
      }),
    ).toEqual([
      "População residente em 2022: 54.658.515 pessoas, 3,0% a mais que em 2010.",
      "Mulheres são 51,7% da população e homens, 48,3%.",
      "A faixa etária mais numerosa é a de 30 a 39 anos.",
      "Parda é a cor ou raça mais declarada (69,1% de quem declarou).",
    ]);
  });

  it("skips what has no data", () => {
    expect(
      describeDemografia({
        filters: { ano: 2000, area: "nordeste" },
        serie: [],
        sexo: { mulheres: 0, homens: 0 },
        piramide: [],
        corRaca: [],
      }),
    ).toEqual([]);
  });
});
