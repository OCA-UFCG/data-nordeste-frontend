import { describe, expect, it } from "vitest";
import { formatPanelUpdatedAt } from "@/features/panels/panelUpdatedAt";

describe("formatPanelUpdatedAt", () => {
  it("formats month and year from an ISO date", () => {
    expect(formatPanelUpdatedAt("2026-10-22")).toBe("10/2026");
    expect(formatPanelUpdatedAt("2026-10-22T00:00:00.000Z")).toBe("10/2026");
  });

  it("keeps the month on the first and last day, whatever the time zone", () => {
    expect(formatPanelUpdatedAt("2026-11-01T00:00:00.000Z")).toBe("11/2026");
    expect(formatPanelUpdatedAt("2026-10-31T23:30:00-03:00")).toBe("10/2026");
  });

  it("returns undefined without a date or with an unexpected format", () => {
    expect(formatPanelUpdatedAt(undefined)).toBeUndefined();
    expect(formatPanelUpdatedAt("")).toBeUndefined();
    expect(formatPanelUpdatedAt("22/10/2026")).toBeUndefined();
  });
});
