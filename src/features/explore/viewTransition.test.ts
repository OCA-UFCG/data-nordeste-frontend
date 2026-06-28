import { afterEach, describe, expect, it, vi } from "vitest";
import {
  exploreCardTransitionName,
  runExploreTransition,
} from "./viewTransition";

describe("explore view transitions", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(document, "startViewTransition");
  });

  it("uses a stable transition name and the native API", () => {
    const update = vi.fn();
    const startViewTransition = vi.fn((callback: () => void) => callback());
    Object.assign(document, { startViewTransition });
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false })),
    );

    runExploreTransition(update);

    expect(exploreCardTransitionName("post:item/1")).toBe(
      "explore-card-post-item-1",
    );
    expect(startViewTransition).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledOnce();
  });

  it("updates immediately when reduced motion is requested", () => {
    const update = vi.fn();
    const startViewTransition = vi.fn();
    Object.assign(document, { startViewTransition });
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true })),
    );

    runExploreTransition(update);

    expect(update).toHaveBeenCalledOnce();
    expect(startViewTransition).not.toHaveBeenCalled();
  });
});
