import { describe, expect, it } from "vitest";
import { formatReaisAxis, formatReaisCompact } from "@/features/panels/format";
import {
  buildTrendOption,
  trendLabelIndexes,
} from "@/features/panels/trendOption";

const POINTS = [
  { label: "2021", value: 1.2431e12 },
  { label: "2022", value: 1.38805e12 },
  { label: "2023", value: 1.51306e12 },
];

type LabelFormatter = (params: { value: number; dataIndex: number }) => string;

const trendLabels = (width: number, selectedIndex = 2): string[] => {
  const option = buildTrendOption(
    {
      points: POINTS,
      seriesName: "PIB",
      selectedIndex,
      formatLabel: (value) => formatReaisCompact(value),
      formatValue: (value) => formatReaisCompact(value),
      formatAxis: formatReaisAxis,
    },
    width,
  ) as { series: { label: { formatter: LabelFormatter } }[] };
  const { formatter } = option.series[0].label;

  return POINTS.map((point, dataIndex) =>
    formatter({ value: point.value, dataIndex }),
  );
};

describe("buildTrendOption", () => {
  it("labels only the ends and the selected year on wide screens", () => {
    expect(trendLabels(900)).toEqual(["R$ 1,24 tri", "", "R$ 1,51 tri"]);
    expect(trendLabels(900, 1)).toEqual([
      "R$ 1,24 tri",
      "R$ 1,39 tri",
      "R$ 1,51 tri",
    ]);
  });

  it("shows the change from the previous year in the tooltip", () => {
    const option = buildTrendOption(
      {
        points: POINTS,
        seriesName: "PIB",
        selectedIndex: 2,
        formatLabel: String,
        formatValue: (value) => formatReaisCompact(value),
        formatAxis: formatReaisAxis,
      },
      900,
    ) as {
      tooltip: { formatter: (params: { dataIndex: number }[]) => string };
    };
    const html = option.tooltip.formatter([{ dataIndex: 1 }]);

    expect(html).toContain("R$ 1,39 tri");
    expect(html).toContain("+11,7% em relação a 2021");
    expect(option.tooltip.formatter([{ dataIndex: 0 }])).not.toContain(
      "em relação",
    );
  });

  it("drops point labels on narrow screens", () => {
    expect(trendLabels(200)).toEqual(["", "", ""]);
  });
});

describe("buildTrendOption on a phone", () => {
  type AxisOption = {
    xAxis: { axisLabel: { interval: (index: number) => boolean } };
    series: { showAllSymbol: boolean }[];
  };
  const YEARS = Array.from({ length: 14 }, (_, index) => String(2010 + index));
  const phoneOption = (selectedIndex: number) =>
    buildTrendOption(
      {
        points: YEARS.map((label) => ({ label, value: 1 })),
        seriesName: "PIB",
        selectedIndex,
        formatLabel: String,
        formatValue: String,
        formatAxis: String,
      },
      360,
    ) as AxisOption;
  const axisYears = (selectedIndex: number) =>
    YEARS.filter((_, index) =>
      phoneOption(selectedIndex).xAxis.axisLabel.interval(index),
    );

  it("counts axis labels from the last year", () => {
    expect(axisYears(13)).toEqual(["2011", "2015", "2019", "2023"]);
  });

  it("labels the selected year and hides the labels closer than a step", () => {
    expect(axisYears(11)).toEqual(["2011", "2015", "2021"]);
  });

  it("skips every other year on a desktop chart too narrow for all 14", () => {
    const option = buildTrendOption(
      {
        points: YEARS.map((label) => ({ label, value: 1 })),
        seriesName: "PIB",
        selectedIndex: 11,
        formatLabel: String,
        formatValue: String,
        formatAxis: String,
      },
      571,
    ) as AxisOption;

    expect(
      YEARS.filter((_, index) => option.xAxis.axisLabel.interval(index)),
    ).toEqual(["2011", "2013", "2015", "2017", "2019", "2021", "2023"]);
  });

  it("draws every point, so the selected year never disappears", () => {
    expect(phoneOption(13).series[0].showAllSymbol).toBe(true);
  });
});

describe("trendLabelIndexes", () => {
  it("drops an end label too close to the selected year", () => {
    expect([...trendLabelIndexes(14, 11, 3)]).toEqual([11, 0]);
    expect([...trendLabelIndexes(14, 6, 3)]).toEqual([6, 0, 13]);
    expect([...trendLabelIndexes(14, 13, 3)]).toEqual([13, 0]);
    expect([...trendLabelIndexes(14, -1, 3)]).toEqual([0, 13]);
  });
});
