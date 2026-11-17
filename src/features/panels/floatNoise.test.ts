import { describe, expect, it } from "vitest";
import { dropFloatNoise } from "@/features/panels/floatNoise";

describe("dropFloatNoise", () => {
  it("rounds away floating point noise and keeps exact values", () => {
    expect(dropFloatNoise(0.1 + 0.2)).toBe(0.3);
    expect(dropFloatNoise(2.5e6 * 3)).toBe(7.5e6);
    expect(dropFloatNoise(1.6e12)).toBe(1.6e12);
  });
});
