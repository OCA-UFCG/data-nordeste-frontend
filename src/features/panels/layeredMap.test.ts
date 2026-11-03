import { describe, expect, it } from "vitest";
import {
  buildLayeredMapOption,
  type LayeredMapConfig,
} from "@/features/panels/layeredMap";

const config: LayeredMapConfig = {
  mapName: "municipios",
  canPan: true,
  selectedCodes: ["2611606"],
  borders: null,
  regions: [
    { code: "2611606", color: "#31a354", tooltip: "<strong>Recife</strong>" },
    { code: "2604106", color: "#c7e9c0", tooltip: "<strong>Caruaru</strong>" },
  ],
};

type GeoOption = {
  map: string;
  regions: {
    name: string;
    itemStyle: { areaColor: string; borderWidth?: number };
  }[];
};
type TooltipOption = { formatter: (params: { name?: string }) => string };

describe("buildLayeredMapOption", () => {
  it("colours each region on the geo and outlines the selected one", () => {
    const geo = buildLayeredMapOption(config).geo as GeoOption;

    expect(geo.map).toBe("municipios");
    expect(geo.regions[0].itemStyle).toMatchObject({
      areaColor: "#31a354",
      borderWidth: 3,
    });
    expect(geo.regions[1].itemStyle.borderWidth).toBeUndefined();
  });

  it("looks the tooltip up by region code", () => {
    const tooltip = buildLayeredMapOption(config).tooltip as TooltipOption;

    expect(tooltip.formatter({ name: "2604106" })).toBe(
      "<strong>Caruaru</strong>",
    );
    expect(tooltip.formatter({ name: "9999999" })).toBe("");
  });

  it("draws the border layer only when it is on", () => {
    const off = buildLayeredMapOption(config);
    const on = buildLayeredMapOption({
      ...config,
      borders: [
        [
          [0, 0],
          [1, 0],
        ],
      ],
    });

    expect(off.series).toEqual([]);
    expect(on.series).toMatchObject([
      { type: "lines", coordinateSystem: "geo", silent: true },
    ]);
  });
});
