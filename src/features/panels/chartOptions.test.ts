import { describe, expect, it, vi } from "vitest";
import {
  buildChoroplethColorOption,
  buildChoroplethFrameOption,
  buildColumnOption,
  buildHorizontalBarOption,
} from "@/features/panels/chartOptions";
import { formatReaisCompact } from "@/features/panels/format";
import type { MapBounds } from "@/features/panels/mapFraming";
import type { ChartOption } from "@/lib/echarts";
import {
  rankRegions,
  type ChoroplethBucket,
} from "@/features/panels/choropleth";

// Faixas de PIB por município, só para o teste.
const BUCKETS: readonly ChoroplethBucket[] = [
  { max: 2e10, label: "< 20 Bi", color: "#be4610" },
  { max: 3.5e10, label: "20 Bi - 35 Bi", color: "#7a3014" },
  { max: Infinity, label: "> 35 Bi", color: "#421608" },
];

// Repassa ao ranking real, só para contar as chamadas.
vi.mock("@/features/panels/choropleth", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/panels/choropleth")>();

  return { ...actual, rankRegions: vi.fn(actual.rankRegions) };
});

const COLORS = {
  regions: [
    { code: "2611606", name: "Recife", uf: "PE", value: 6e10 },
    { code: "2507507", name: "João Pessoa", uf: "PB", value: 2e10 },
  ],
  buckets: BUCKETS,
  valueLabel: "PIB",
  formatValue: (value: number) => formatReaisCompact(value),
};

type ColorOption = {
  tooltip: { formatter: (params: { data?: object }) => string };
  series: { id: string; type: string; data: object[] }[];
};

describe("buildChoroplethColorOption", () => {
  const itemsOf = (option: ChartOption) =>
    (option as { series: { data: object[] }[] }).series[0].data;

  it("shows the position in the ranking in the tooltip", () => {
    const option = buildChoroplethColorOption(COLORS) as ColorOption;
    const [, joaoPessoa] = itemsOf(option);

    expect(option.tooltip.formatter({ data: joaoPessoa })).toContain("2º de 2");
  });

  it("escapes region names in the HTML tooltip", () => {
    const option = buildChoroplethColorOption({
      ...COLORS,
      regions: [
        { code: "2611606", name: "<b>Recife</b>", uf: "PE", value: 6e10 },
      ],
    }) as ColorOption;
    const [item] = itemsOf(option);

    expect(option.tooltip.formatter({ data: item })).toContain(
      "&lt;b&gt;Recife&lt;/b&gt; (PE)",
    );
  });

  it("greys out regions outside the highlight", () => {
    const option = buildChoroplethColorOption({
      ...COLORS,
      highlightCodes: new Set(["2611606"]),
    });
    const [recife, joaoPessoa] = itemsOf(option) as {
      itemStyle: { areaColor: string };
    }[];

    expect(recife.itemStyle.areaColor).toBe("#421608");
    expect(joaoPessoa.itemStyle.areaColor).toBe("#e5e5e5");
  });

  // O hover na lista refaz a opção de cor; o ranking de ~1.800 não precisa.
  it("ranks each set of regions once across highlight changes", () => {
    const regions = [...COLORS.regions];

    vi.mocked(rankRegions).mockClear();
    buildChoroplethColorOption({ ...COLORS, regions });
    buildChoroplethColorOption({
      ...COLORS,
      regions,
      highlightCodes: new Set(["2611606"]),
    });
    expect(rankRegions).toHaveBeenCalledTimes(1);

    buildChoroplethColorOption({ ...COLORS, regions: [...regions] });
    expect(rankRegions).toHaveBeenCalledTimes(2);
  });

  // Merge com center/zoom desfaria o zoom e o arrasto a cada destaque.
  it("leaves the user's zoom and pan alone", () => {
    const [series] = (
      buildChoroplethColorOption({
        ...COLORS,
        selectedCode: "2611606",
        highlightCodes: new Set(["2611606"]),
      }) as ColorOption
    ).series;

    for (const key of ["center", "zoom", "boundingCoords", "map", "roam"]) {
      expect(series).not.toHaveProperty(key);
    }
  });
});

describe("buildChoroplethFrameOption", () => {
  type FrameOption = {
    series: {
      id: string;
      roam: boolean | "scale";
      boundingCoords?: MapBounds;
      center?: [number, number];
      zoom?: number;
      scaleLimit: { min: number; max?: number };
    }[];
  };

  it("pans only with a mouse, keeping one-finger drag for page scroll", () => {
    const roam = (canPan?: boolean) =>
      (buildChoroplethFrameOption({ mapName: "test", canPan }) as FrameOption)
        .series[0].roam;

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
      buildChoroplethFrameOption({
        mapName: "test",
        framing: {
          bounds: area,
          maxZoom: 500,
          focus: { center: [-39.5, -10.5], zoom: 8 },
        },
      }) as FrameOption
    ).series;

    expect(series).toMatchObject({
      boundingCoords: area,
      center: [-39.5, -10.5],
      zoom: 8,
      scaleLimit: { min: 1, max: 500 },
    });
    expect(series).not.toHaveProperty("data");
  });

  it("shares the series id with the color option, so the merge finds it", () => {
    const frame = buildChoroplethFrameOption({
      mapName: "test",
    }) as FrameOption;
    const colors = buildChoroplethColorOption(COLORS) as ColorOption;

    expect(colors.series[0].id).toBe(frame.series[0].id);
  });
});

describe("buildHorizontalBarOption", () => {
  it("paints a bar in its own color and the rest in the series color", () => {
    const option = buildHorizontalBarOption(
      [
        { label: "Homem", value: 657, color: "#97B42E" },
        { label: "Total", value: 640 },
      ],
      String,
      640,
      "#f5791a",
    ) as { series: { data: unknown[]; itemStyle: { color: string } }[] };

    expect(option.series[0].data).toEqual([
      { value: 657, itemStyle: { color: "#97B42E" } },
      640,
    ]);
    expect(option.series[0].itemStyle.color).toBe("#f5791a");
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
