import { describe, expect, it } from "vitest";
import { buildPyramidOption } from "@/features/panels/pyramidOption";

describe("buildPyramidOption", () => {
  type PyramidOption = {
    series: { data?: { label: { show: boolean; position: string } }[] }[];
  };
  const config = {
    categories: ["60 a 69 anos", "30 a 39 anos"],
    left: { name: "Mulher", color: "#c53d69", values: [2_291_237, 4_446_912] },
    right: { name: "Homem", color: "#97b42e", values: [1_941_743, 4_060_504] },
    formatValue: (value: number) => value.toLocaleString("pt-BR"),
    formatShort: (value: number) => `${Math.round(value / 1e5) / 10} mi`,
  };
  const labels = (width: number) =>
    (buildPyramidOption(config, width) as PyramidOption).series
      .slice(0, 2)
      .map((series) => series.data?.map((item) => item.label));

  it("moves a label outside when the bar is narrower than the number", () => {
    expect(
      labels(520).map((side) => side?.map((label) => label.position)),
    ).toEqual([
      ["inside", "inside"],
      ["right", "inside"],
    ]);
  });

  it("hides the numbers when there is no room for bar plus label", () => {
    expect(
      labels(260)
        .flat()
        .every((label) => !label?.show),
    ).toBe(true);
  });
});
