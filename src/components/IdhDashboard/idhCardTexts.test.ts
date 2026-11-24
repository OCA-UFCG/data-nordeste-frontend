import { describe, expect, it } from "vitest";
import { idhEvolutionInfo } from "@/components/IdhDashboard/idhCardTexts";
import { NO_IDH_YEARS } from "@/features/panels/idh/idhYearRange";

describe("idhCardTexts", () => {
  it("builds the period from the database range", () => {
    expect(idhEvolutionInfo({ first: 2015, last: 2024 })).toContain(
      "de 2015 a 2024",
    );
  });

  it("omits the period when the database gave no years", () => {
    expect(idhEvolutionInfo(NO_IDH_YEARS)).not.toMatch(/\d/);
  });
});
