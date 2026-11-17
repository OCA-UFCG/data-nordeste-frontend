import { describe, expect, it } from "vitest";
import {
  panViewBox,
  zoomViewBox,
  type ViewBox,
} from "@/features/panels/mapViewBox";

const BASE: ViewBox = { x: 0, y: 0, width: 600, height: 754 };

describe("zoomViewBox", () => {
  it("zooms into the point under the cursor, keeping it in place", () => {
    const zoomed = zoomViewBox(BASE, BASE, 2, { x: 0.25, y: 0.5 });

    expect(zoomed.width).toBe(300);
    expect(zoomed.x + zoomed.width * 0.25).toBeCloseTo(150);
    expect(zoomed.y + zoomed.height * 0.5).toBeCloseTo(377);
  });

  it("never zooms past 8× nor out past the whole map", () => {
    expect(zoomViewBox(BASE, BASE, 100).width).toBe(600 / 8);
    expect(zoomViewBox(BASE, BASE, 0.1)).toEqual(BASE);
  });
});

describe("panViewBox", () => {
  it("moves the view and stops at the edges of the map", () => {
    const zoomed = zoomViewBox(BASE, BASE, 2);

    expect(panViewBox(zoomed, BASE, { x: 50, y: 0 }).x).toBe(zoomed.x + 50);
    expect(panViewBox(zoomed, BASE, { x: -999, y: -999 })).toMatchObject({
      x: 0,
      y: 0,
    });
  });
});
