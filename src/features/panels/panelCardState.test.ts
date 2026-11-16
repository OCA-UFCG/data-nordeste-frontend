import { describe, expect, it } from "vitest";
import { resolvePanelCardState } from "@/features/panels/panelCardState";

describe("resolvePanelCardState", () => {
  it("shows the skeleton while loading, even after a failure", () => {
    expect(resolvePanelCardState({ failed: true, loading: true })).toBe(
      "loading",
    );
  });

  it("shows the error when failed and not loading", () => {
    expect(resolvePanelCardState({ failed: true, loading: false })).toBe(
      "error",
    );
  });

  it("shows the data when neither failed nor loading", () => {
    expect(resolvePanelCardState({ failed: false, loading: false })).toBe("ok");
  });

  it("shows the skeleton when loading without a failure", () => {
    expect(resolvePanelCardState({ failed: false, loading: true })).toBe(
      "loading",
    );
  });
});
