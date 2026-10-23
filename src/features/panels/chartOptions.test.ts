import { describe, expect, it } from "vitest";
import {
  buildChoroplethOption,
  buildColumnOption,
  buildPyramidOption,
  buildTrendOption,
} from "@/features/panels/chartOptions";
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
