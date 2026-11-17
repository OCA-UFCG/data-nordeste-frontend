import { describe, expect, it } from "vitest";
import { linePath } from "@/features/panels/svgPath";

describe("linePath", () => {
  it("moves to the first point and draws lines to the others", () => {
    expect(
      linePath([
        { x: 0, y: 10 },
        { x: 5.04, y: 8 },
      ]),
    ).toBe("M0.0 10.0L5.0 8.0");
  });
});
