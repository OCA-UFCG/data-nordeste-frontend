import { describe, expect, it } from "vitest";
import {
  buildLayeredColorOption,
  buildLayeredMapOption,
  type LayeredMapColors,
  type LayeredMapFrame,
} from "@/features/panels/layeredMap";

const frame: LayeredMapFrame = {
  mapName: "municipios",
  canPan: true,
  borders: null,
};

const config: LayeredMapColors = {
  selectedCodes: ["2611606"],
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
  it("frames the mesh on the geo component", () => {
    const geo = buildLayeredMapOption(frame).geo as GeoOption;

    expect(geo.map).toBe("municipios");
  });

  it("draws the border layer only when it is on", () => {
    const off = buildLayeredMapOption(frame);
    const on = buildLayeredMapOption({
      ...frame,
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

describe("buildLayeredColorOption", () => {
  it("colours each region on the geo and outlines the selected one", () => {
    const geo = buildLayeredColorOption(config).geo as GeoOption;

    expect(geo.regions[0].itemStyle).toMatchObject({
      areaColor: "#31a354",
      borderWidth: 3,
    });
    expect(geo.regions[1].itemStyle.borderWidth).toBeUndefined();
  });

  it("looks the tooltip up by region code", () => {
    const tooltip = buildLayeredColorOption(config).tooltip as TooltipOption;

    expect(tooltip.formatter({ name: "2604106" })).toBe(
      "<strong>Caruaru</strong>",
    );
    expect(tooltip.formatter({ name: "9999999" })).toBe("");
  });

  it("greys out the regions outside the highlight", () => {
    const geo = buildLayeredColorOption({
      ...config,
      highlightCodes: new Set(["2604106"]),
    }).geo as GeoOption;

    expect(geo.regions[0].itemStyle.areaColor).toBe("#e5e5e5");
    expect(geo.regions[1].itemStyle.areaColor).toBe("#c7e9c0");
  });
});
