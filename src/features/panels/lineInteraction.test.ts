import { describe, expect, it } from "vitest";
import { stepCategory } from "@/features/panels/lineInteraction";

describe("stepCategory", () => {
  const YEARS = ["2019", "2020", "2021"];

  it("moves one year with the arrows and stops at the ends", () => {
    expect(stepCategory(YEARS, "2020", "ArrowLeft")).toBe("2019");
    expect(stepCategory(YEARS, "2020", "ArrowRight")).toBe("2021");
    expect(stepCategory(YEARS, "2021", "ArrowRight")).toBeNull();
  });

  it("jumps to the first and last year with Home and End", () => {
    expect(stepCategory(YEARS, "2020", "Home")).toBe("2019");
    expect(stepCategory(YEARS, "2020", "End")).toBe("2021");
  });

  it("ignores other keys", () => {
    expect(stepCategory(YEARS, "2020", "Enter")).toBeNull();
  });
});
