import { describe, expect, it } from "vitest";
import { buildGaugeOption } from "@/features/panels/gaugeOption";

type GaugeSeriesOption = {
  max: number;
  progress: { itemStyle: { color: string } };
  axisLabel: { formatter: (value: number) => string };
  data: { value: number; name: string }[];
};

describe("buildGaugeOption", () => {
  it("fills the arc up to the value and labels only the two ends", () => {
    const option = buildGaugeOption(
      {
        name: "Homem",
        value: 0.74,
        max: 1,
        color: "#97B42E",
        formatValue: (value) => value.toFixed(2),
      },
      280,
    ) as { series: GaugeSeriesOption[] };
    const [gauge] = option.series;

    expect(gauge.max).toBe(1);
    expect(gauge.progress.itemStyle.color).toBe("#97B42E");
    expect(gauge.data).toEqual([{ value: 0.74, name: "Homem" }]);
    expect([0, 0.5, 1].map(gauge.axisLabel.formatter)).toEqual([
      "\n0.00",
      "",
      "\n1.00",
    ]);
  });
});
