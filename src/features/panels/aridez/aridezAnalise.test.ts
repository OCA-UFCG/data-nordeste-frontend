import { describe, expect, it } from "vitest";
import { buildAridezAnalise } from "@/features/panels/aridez/aridezAnalise";
import { EMPTY_ARIDEZ_AREAS } from "@/features/panels/aridez/aridezClasses";

const AREAS_2021 = { arido: 0, semiarido: 600, subumido: 200, umido: 200 };
const AREAS_1991 = { arido: 0, semiarido: 500, subumido: 140, umido: 360 };

const input = {
  ano: 2021,
  areas: AREAS_2021,
  baseAreas: AREAS_1991,
  place: "Pernambuco",
  placeFull: "Nordeste · Pernambuco",
};

describe("buildAridezAnalise", () => {
  it("compares the ASD with 1991", () => {
    const [asd] = buildAridezAnalise(input)?.blocks ?? [];

    expect(asd.title).toBe(
      "Variação da Área Suscetível à Desertificação (ASD):",
    );
    expect(asd.text).toBe(
      "A área selecionada em 1991 tinha 640,00\u00a0km² em ASD. Em 2021, passou para 800,00\u00a0km². Isso representa uma variação de 160,00\u00a0km², equivalente a 25,00%.",
    );
  });

  it("names the predominant class and the runner-up", () => {
    const [, classes] = buildAridezAnalise(input)?.blocks ?? [];

    expect(classes.text).toBe(
      "No recorte selecionado (Pernambuco), a classe predominante é semiárido, com 60,00% da área (600\u00a0km²), seguida de subúmido seco, com 20,00%. A área suscetível (ASD) responde por 80,00% do total.",
    );
  });

  it("skips the percent when 1991 had no ASD", () => {
    const [asd] =
      buildAridezAnalise({
        ...input,
        baseAreas: { ...EMPTY_ARIDEZ_AREAS, umido: 1000 },
      })?.blocks ?? [];

    expect(asd.text).toMatch(/variação de 800,00\u00a0km²\.$/);
  });

  it("states the ASD alone when the base year itself is chosen", () => {
    const [asd] =
      buildAridezAnalise({ ...input, ano: 1991, areas: AREAS_1991 })?.blocks ??
      [];

    expect(asd.text).toBe(
      "Em 1991, a área selecionada tinha 640,00\u00a0km² em ASD.",
    );
  });

  it("says when the place has no susceptible area", () => {
    const [asd] =
      buildAridezAnalise({
        ...input,
        areas: { ...EMPTY_ARIDEZ_AREAS, umido: 300 },
      })?.blocks ?? [];

    expect(asd.text).toMatch(/^O recorte selecionado \(Pernambuco\) não tem/);
  });

  it("writes the filters in the footnote and is null without classified area", () => {
    expect(buildAridezAnalise(input)?.footnote).toBe(
      "Texto gerado conforme os filtros aplicados: Nordeste · Pernambuco · 2021.",
    );
    expect(
      buildAridezAnalise({ ...input, areas: EMPTY_ARIDEZ_AREAS }),
    ).toBeNull();
  });
});
