import { describe, expect, it } from "vitest";
import { PIB_CARD_INFO } from "@/components/PibDashboard/pibTexts";

describe("PIB_CARD_INFO", () => {
  it("cites the last VAB year from the database in the sector tooltips", () => {
    expect(PIB_CARD_INFO.vab(2022)).toContain(
      "Os dados setoriais vão até 2022.",
    );
    expect(PIB_CARD_INFO.atividade(2022)).toContain(
      "Os dados setoriais vão até 2022.",
    );
  });

  it("drops the year sentence while the year is unknown", () => {
    expect(PIB_CARD_INFO.vab(null)).not.toContain("vão até");
    expect(PIB_CARD_INFO.atividade(null)).not.toContain("vão até");
  });
});
