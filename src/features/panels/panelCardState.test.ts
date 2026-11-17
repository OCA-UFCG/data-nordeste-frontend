import { describe, expect, it } from "vitest";
import {
  resolveDependentCardStates,
  resolvePanelCardState,
} from "@/features/panels/panelCardState";

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

describe("resolveDependentCardStates", () => {
  const CURRENT = { ano: 2021, uf: ["PE"] as string[] | undefined };
  const DEPENDENCIES = { map: ["ano"], serie: ["uf"] } as const;
  const resolve = (pending: typeof CURRENT | null, failed = false) =>
    resolveDependentCardStates(
      { failed, retrying: false, pending },
      CURRENT,
      DEPENDENCIES,
    );

  it("dims only the cards whose filter changed", () => {
    expect(resolve({ ano: 2021, uf: ["PB"] })).toEqual({
      map: "ok",
      serie: "stale",
    });
  });

  it("compares state lists by content, not by reference", () => {
    expect(resolve({ ano: 2021, uf: ["PE"] })).toEqual({
      map: "ok",
      serie: "ok",
    });
  });

  it("shows the skeleton while a failed panel loads again", () => {
    expect(resolve({ ano: 2020, uf: ["PE"] }, true).map).toBe("loading");
  });
});
