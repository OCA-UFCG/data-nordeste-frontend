import { describe, expect, it } from "vitest";
import {
  buildChoroplethOption,
  buildColumnOption,
  buildTrendOption,
} from "@/features/panels/chartOptions";
import { formatReaisAxis, formatReaisCompact } from "@/features/panels/format";
import { PIB_MAP_BUCKETS } from "@/features/panels/pib/pibPanel";

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
  it("labels every point on wide screens", () => {
    expect(trendLabels(900)).toEqual([
      "R$ 1,24 tri",
      "R$ 1,39 tri",
      "R$ 1,51 tri",
    ]);
  });

  it("keeps only the selected and latest labels when they would overlap", () => {
    expect(trendLabels(200)).toEqual(["", "", "R$ 1,51 tri"]);
  });

  it("always labels the selected point", () => {
    expect(trendLabels(200, 0)).toEqual(["R$ 1,24 tri", "", "R$ 1,51 tri"]);
  });
});

describe("buildChoroplethOption", () => {
  it("escapes region names in the HTML tooltip", () => {
    const option = buildChoroplethOption({
      regions: [
        { code: "2611606", name: "<b>Recife</b>", uf: "PE", value: 6e10 },
      ],
      buckets: PIB_MAP_BUCKETS,
      mapName: "test",
      valueLabel: "PIB",
      formatValue: (value) => formatReaisCompact(value),
    }) as {
      tooltip: { formatter: (params: { data?: object }) => string };
      series: { data: object[] }[];
    };
    const [item] = option.series[0].data;

    expect(option.tooltip.formatter({ data: item })).toContain(
      "&lt;b&gt;Recife&lt;/b&gt; (PE)",
    );
  });

  it("enables zoom, keeping one-finger drag for page scroll on phones", () => {
    const config = {
      regions: [],
      buckets: PIB_MAP_BUCKETS,
      mapName: "test",
      valueLabel: "PIB",
      formatValue: (value: number) => formatReaisCompact(value),
    };
    const roam = (width: number) =>
      (
        buildChoroplethOption({ ...config, width }) as {
          series: { roam: boolean | string }[];
        }
      ).series[0].roam;

    expect(roam(1200)).toBe(true);
    expect(roam(360)).toBe("scale");
  });
});

describe("buildColumnOption", () => {
  const config = {
    categories: ["2012", "2021"],
    formatLabel: (value: number) => value.toFixed(3),
    formatValue: (value: number) => value.toFixed(3),
  };
  type ColumnOption = {
    legend?: object;
    series: { label: { formatter: (params: { value: number }) => string } }[];
  };

  it("shows a legend only when there is more than one series", () => {
    const single = buildColumnOption({
      ...config,
      series: [{ name: "IDH", color: "#f5791a", values: [0.675, 0.702] }],
    }) as ColumnOption;
    const grouped = buildColumnOption({
      ...config,
      series: [
        { name: "IDH", color: "#f5791a", values: [0.675, 0.702] },
        { name: "IDH ajustado", color: "#fabd77", values: [0.493, 0.518] },
      ],
    }) as ColumnOption;

    expect(single.legend).toBeUndefined();
    expect(grouped.legend).toBeDefined();
    expect(grouped.series[1].label.formatter({ value: 0.493 })).toBe("0.493");
  });
});
