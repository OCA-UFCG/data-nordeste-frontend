import {
  baseOption,
  SELECTED_BORDER,
  TOOLTIP_BASE,
} from "@/features/panels/chartBase";
import {
  mapViewportOption,
  type ChoroplethFrame,
} from "@/features/panels/chartOptions";
import type { BorderSegment } from "@/features/panels/stateBorders";
import type { ChartOption } from "@/lib/echarts";

export const BORDER_COLOR = "#292829";

// `tooltip` já vem em HTML escapado, montado por quem conhece o indicador.
export type LayeredRegion = { code: string; color: string; tooltip: string };

export type LayeredMapConfig = ChoroplethFrame & {
  regions: LayeredRegion[];
  selectedCodes: string[];
  borders: BorderSegment[] | null;
};

const geoRegions = ({ regions, selectedCodes }: LayeredMapConfig) => {
  const selected = new Set(selectedCodes);

  return regions.map((region) => ({
    name: region.code,
    itemStyle: {
      areaColor: region.color,
      ...(selected.has(region.code)
        ? { borderColor: SELECTED_BORDER, borderWidth: 3 }
        : {}),
    },
  }));
};

const tooltipByCode = (regions: LayeredRegion[]) => {
  const tooltips = new Map(
    regions.map((region) => [region.code, region.tooltip]),
  );

  return ({ name }: { name?: string }) => (name && tooltips.get(name)) || "";
};

// Linhas no sistema de coordenadas do geo: zoom e arrasto seguem o mapa.
const bordersSeries = (borders: BorderSegment[]) => ({
  type: "lines",
  coordinateSystem: "geo",
  geoIndex: 0,
  silent: true,
  animation: false,
  lineStyle: { color: BORDER_COLOR, width: 1.2, opacity: 1 },
  data: borders.map((coords) => ({ coords })),
});

/**
 * Choropleth on a `geo` component, so extra layers (state borders) can be
 * drawn as series that share its zoom and pan.
 * @example buildLayeredMapOption({ mapName, regions, selectedCodes: [], borders: null })
 */
export const buildLayeredMapOption = (
  config: LayeredMapConfig,
): ChartOption => ({
  ...baseOption(),
  tooltip: {
    ...TOOLTIP_BASE,
    trigger: "item",
    formatter: tooltipByCode(config.regions),
  },
  geo: {
    ...mapViewportOption(config),
    emphasis: {
      label: { show: false },
      itemStyle: { areaColor: SELECTED_BORDER },
    },
    tooltip: { show: true },
    label: { show: false },
    regions: geoRegions(config),
  },
  series: config.borders ? [bordersSeries(config.borders)] : [],
});
