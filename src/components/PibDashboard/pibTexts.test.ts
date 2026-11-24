import { describe, expect, it } from "vitest";
import {
  PIB_CARD_INFO,
  PIB_VAB_TERM,
} from "@/components/PibDashboard/pibTexts";

describe("PIB_CARD_INFO", () => {
  it("explains the VAB card with the content team wording", () => {
    expect(PIB_CARD_INFO.vab).toBe(
      "Valor Adicionado Bruto (VAB) por setor representa o quanto cada setor da economia contribui para a geração de riqueza, ou seja, para o Produto Interno Bruto (PIB).",
    );
    expect(PIB_CARD_INFO.vab.startsWith(PIB_VAB_TERM)).toBe(true);
  });

  it("cites the last VAB year from the database in the activity tooltip", () => {
    expect(PIB_CARD_INFO.atividade(2022)).toContain(
      "Os dados setoriais vão até 2022.",
    );
  });

  it("drops the year sentence while the year is unknown", () => {
    expect(PIB_CARD_INFO.atividade(null)).not.toContain("vão até");
  });
});
