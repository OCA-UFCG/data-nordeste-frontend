import { describe, expect, it } from "vitest";
import { resolveIdhCardState } from "@/features/panels/idh/idhCardState";

describe("resolveIdhCardState", () => {
  it("shows loading while retrying a failed query", () => {
    expect(resolveIdhCardState({ failed: true, loading: true })).toBe(
      "loading",
    );
  });

  it("shows the error once the retry settles still failing", () => {
    expect(resolveIdhCardState({ failed: true, loading: false })).toBe("error");
  });

  it("shows loading while filters navigate", () => {
    expect(resolveIdhCardState({ failed: false, loading: true })).toBe(
      "loading",
    );
  });

  it("is ok when nothing is pending and the query worked", () => {
    expect(resolveIdhCardState({ failed: false, loading: false })).toBe("ok");
  });
});
