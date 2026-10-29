import { describe, expect, it } from "vitest";
import {
  buildChoroplethOption,
  buildColumnOption,
  buildPyramidOption,
  buildTrendOption,
} from "@/features/panels/chartOptions";
import { trendLabelIndexes } from "@/features/panels/trendOption";
import { formatReaisAxis, formatReaisCompact } from "@/features/panels/format";
import type { MapBounds } from "@/features/panels/mapFraming";
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

describe("buildChoroplethOption", () => {
  it("shows the position in the ranking in the tooltip", () => {
    const option = buildChoroplethOption({
      regions: [
        { code: "2611606", name: "Recife", uf: "PE", value: 6e10 },
        { code: "2507507", name: "João Pessoa", uf: "PB", value: 2e10 },
      ],
      buckets: PIB_MAP_BUCKETS,
      mapName: "test",
      valueLabel: "PIB",
      formatValue: (value) => formatReaisCompact(value),
    }) as {
      tooltip: { formatter: (params: { data?: object }) => string };
      series: { data: object[] }[];
    };
    const [, joaoPessoa] = option.series[0].data;

    expect(option.tooltip.formatter({ data: joaoPessoa })).toContain("2º de 2");
  });

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

  it("greys out regions outside the highlight", () => {
    const option = buildChoroplethOption({
      regions: [
        { code: "2611606", name: "Recife", uf: "PE", value: 6e10 },
        { code: "2507507", name: "João Pessoa", uf: "PB", value: 2e10 },
      ],
      buckets: PIB_MAP_BUCKETS,
      mapName: "test",
      valueLabel: "PIB",
      formatValue: (value) => formatReaisCompact(value),
      highlightCodes: new Set(["2611606"]),
    }) as { series: { data: { itemStyle: { areaColor: string } }[] }[] };
    const [recife, joaoPessoa] = option.series[0].data;

    expect(recife.itemStyle.areaColor).toBe("#421608");
    expect(joaoPessoa.itemStyle.areaColor).toBe("#e5e5e5");
  });

  it("pans only with a mouse, keeping one-finger drag for page scroll", () => {
    const config = {
      regions: [],
      buckets: PIB_MAP_BUCKETS,
      mapName: "test",
      valueLabel: "PIB",
      formatValue: (value: number) => formatReaisCompact(value),
    };
    const roam = (canPan?: boolean) =>
      (
        buildChoroplethOption({ ...config, canPan }) as {
          series: { roam: boolean | string }[];
        }
      ).series[0].roam;

    expect(roam(true)).toBe(true);
    expect(roam(false)).toBe("scale");
    expect(roam()).toBe("scale");
  });

  it("keeps the whole area as the frame when a municipality is focused", () => {
    const area: MapBounds = [
      [-46, -3],
      [-35, -18],
    ];
    const [series] = (
      buildChoroplethOption({
        regions: [],
        buckets: PIB_MAP_BUCKETS,
        mapName: "test",
        valueLabel: "PIB",
        formatValue: (value: number) => formatReaisCompact(value),
        framing: {
          bounds: area,
          maxZoom: 500,
          focus: { center: [-39.5, -10.5], zoom: 8 },
        },
      }) as { series: Record<string, unknown>[] }
    ).series;

    expect(series).toMatchObject({
      boundingCoords: area,
      center: [-39.5, -10.5],
      zoom: 8,
      scaleLimit: { min: 1, max: 500 },
    });
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
