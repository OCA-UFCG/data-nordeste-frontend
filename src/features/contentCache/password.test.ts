import { describe, expect, it } from "vitest";
import { isContentCachePasswordValid } from "./password";

describe("isContentCachePasswordValid", () => {
  it("accepts only the exact configured password", () => {
    expect(isContentCachePasswordValid("segredo", "segredo")).toBe(true);
    expect(isContentCachePasswordValid("Segredo", "segredo")).toBe(false);
    expect(isContentCachePasswordValid("", "segredo")).toBe(false);
    expect(isContentCachePasswordValid("segredo-mais-longo", "segredo")).toBe(
      false,
    );
  });
});
