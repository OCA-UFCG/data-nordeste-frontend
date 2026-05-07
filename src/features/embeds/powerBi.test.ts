import { describe, expect, it } from "vitest";
import { buildPowerBiSource } from "./powerBi";

describe("buildPowerBiSource", () => {
  it("adds an encoded pageName query parameter", () => {
    expect(
      buildPowerBiSource("https://powerbi.example/report", "Report Section"),
    ).toBe("https://powerbi.example/report?pageName=Report+Section");
  });

  it("preserves invalid source strings with encoded fallback query", () => {
    expect(buildPowerBiSource("powerbi-source", "A&B")).toBe(
      "powerbi-source?pageName=A%26B",
    );
  });
});
