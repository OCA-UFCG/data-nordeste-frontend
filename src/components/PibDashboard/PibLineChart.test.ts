import { describe, expect, it } from "vitest";
import { PIB_LINE_HEIGHT_CLASS } from "@/components/PibDashboard/PibLineChart";
import {
  buildPibLineGeometry,
  PIB_LINE_HEIGHT,
  PIB_LINE_NARROW_WIDTH,
} from "@/features/panels/pib/pibLineChart";

const SERIE = [
  { ano: 2022, pib: 1e9, perCapita: 1e4 },
  { ano: 2023, pib: 1.1e9, perCapita: 1.1e4 },
];

const heightAt = (width: number) =>
  buildPibLineGeometry({ width, serie: SERIE, selectedIndex: 1 }).height;

describe("PIB_LINE_HEIGHT_CLASS", () => {
  it("matches the SVG frame height on both sides of the narrow width", () => {
    expect(PIB_LINE_HEIGHT_CLASS).toBe(
      `min-h-[${PIB_LINE_HEIGHT.narrow}px] @[${PIB_LINE_NARROW_WIDTH}px]:min-h-[${PIB_LINE_HEIGHT.wide}px]`,
    );
    expect(heightAt(PIB_LINE_NARROW_WIDTH - 1)).toBe(PIB_LINE_HEIGHT.narrow);
    expect(heightAt(PIB_LINE_NARROW_WIDTH)).toBe(PIB_LINE_HEIGHT.wide);
  });
});
