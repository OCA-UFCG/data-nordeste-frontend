import { describe, expect, it } from "vitest";
import {
  buildLineOption,
  lineLabelIndexes,
  lineYearVisible,
} from "@/features/panels/lineOption";

type LabelParams = { value: number; dataIndex: number };
type LineSeriesOption = {
  name: string;
  lineStyle: { color: string; width: number };
  data: { value: number; symbolSize?: number }[];
  label: { formatter: (params: LabelParams) => string };
};
type LineOption = {
  series: LineSeriesOption[];
  xAxis: { axisLabel: { interval: (index: number) => boolean } };
};

const YEARS = Array.from({ length: 10 }, (_, index) => String(2012 + index));

const CONFIG = {
  categories: YEARS,
  series: [
    {
      name: "IDH",
      color: "#7C46E1",
      values: YEARS.map((_, index) => 0.65 + index / 100),
    },
    {
      name: "IDH ajustado",
      color: "#A993F2",
      values: YEARS.map((_, index) => 0.45 + index / 100),
    },
  ],
  selectedIndex: 3,
  formatLabel: (value: number) => value.toFixed(3),
  formatValue: (value: number) => value.toFixed(2),
};

const labeledPoints = (option: LineOption) =>
  option.series.map((series) =>
    series.data
      .map(({ value }, dataIndex) =>
        series.label.formatter({ value, dataIndex }),
      )
      .filter(Boolean),
  );

describe("lineLabelIndexes", () => {
  it("labels every point when each year has room for its value", () => {
    expect(lineLabelIndexes(10, 3, 900).size).toBe(10);
  });

  it("labels only the selected and the last year on a phone", () => {
    expect(lineLabelIndexes(10, 5, 340)).toEqual(new Set([5, 9]));
    expect(lineLabelIndexes(10, 9, 340)).toEqual(new Set([9]));
    expect(lineLabelIndexes(10, 0, 340)).toEqual(new Set([0, 9]));
  });

  it("keeps the first year labelled when the chart is wider", () => {
    expect(lineLabelIndexes(10, 5, 600)).toEqual(new Set([5, 0, 9]));
  });
});

describe("lineYearVisible", () => {
  const visibleYears = (selectedIndex: number, step: number) =>
    YEARS.filter((_, index) =>
      lineYearVisible(YEARS.length, selectedIndex, step)(index),
    );

  it("shows the first year, then every step counted from the last", () => {
    expect(visibleYears(9, 2)).toEqual([
      "2012",
      "2015",
      "2017",
      "2019",
      "2021",
    ]);
  });

  it("drops the first year when the selected one is too close to it", () => {
    expect(visibleYears(1, 2)).toEqual([
      "2013",
      "2015",
      "2017",
      "2019",
      "2021",
    ]);
  });
});

describe("buildLineOption", () => {
  it("draws one line per series in its own color", () => {
    const option = buildLineOption(CONFIG, 640) as LineOption;

    expect(
      option.series.map(({ name, lineStyle }) => [name, lineStyle]),
    ).toEqual([
      ["IDH", { color: "#7C46E1", width: 2.5 }],
      ["IDH ajustado", { color: "#A993F2", width: 2.5 }],
    ]);
  });

  it("highlights the selected year with a bigger marker in every series", () => {
    const option = buildLineOption(CONFIG, 640) as LineOption;

    expect(option.series.map((series) => series.data[3].symbolSize)).toEqual([
      13, 13,
    ]);
    expect(option.series[0].data[4].symbolSize).toBeUndefined();
  });

  it("keeps few labels and spaced years on a phone, with no scroll", () => {
    const option = buildLineOption(CONFIG, 340) as LineOption;
    const years = YEARS.filter((_, index) =>
      option.xAxis.axisLabel.interval(index),
    );

    expect(labeledPoints(option)).toEqual([
      ["0.680", "0.740"],
      ["0.480", "0.540"],
    ]);
    expect(years).toEqual(["2012", "2015", "2017", "2019", "2021"]);
  });
});
