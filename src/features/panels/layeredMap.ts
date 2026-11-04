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

export type LayeredMapFrame = ChoroplethFrame & {
  borders: BorderSegment[] | null;
};

export type LayeredMapColors = {
  regions: LayeredRegion[];
  selectedCodes: string[];
  highlightCodes?: ReadonlySet<string>;
};

const DIMMED_AREA = "#e5e5e5";

const geoRegions = ({
  regions,
  selectedCodes,
  highlightCodes,
}: LayeredMapColors) => {
  const selected = new Set(selectedCodes);

  return regions.map((region) => ({
    name: region.code,
    itemStyle: {
      areaColor:
        highlightCodes && !highlightCodes.has(region.code)
          ? DIMMED_AREA
          : region.color,
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
 * Geometry, framing and border layer of the map, applied from scratch only
 * when the mesh, the framing or the border toggle changes.
 * @example buildLayeredMapOption({ mapName, canPan: true, borders: null })
 */
export const buildLayeredMapOption = (frame: LayeredMapFrame): ChartOption => ({
  ...baseOption(),
  geo: {
    ...mapViewportOption(frame),

    // Contorno das camadas do ArcGIS: os municípios sem contratação são brancos.
    itemStyle: { borderColor: "#4d4d4d", borderWidth: 0.2 },
    emphasis: {
      label: { show: false },
      itemStyle: { areaColor: SELECTED_BORDER },
    },
    tooltip: { show: true },
    label: { show: false },
  },
  series: frame.borders ? [bordersSeries(frame.borders)] : [],
});

/**
 * Colours, highlight and tooltip, merged over the frame option.
 * IMPORTANT: sem center/zoom; com eles, cada destaque desfaria o zoom e o
 * arrasto do usuário.
 * @example buildLayeredColorOption({ regions, selectedCodes: [], highlightCodes: new Set(["2611606"]) })
 */
export const buildLayeredColorOption = (
  colors: LayeredMapColors,
): ChartOption => ({
  tooltip: {
    ...TOOLTIP_BASE,
    trigger: "item",
    formatter: tooltipByCode(colors.regions),
  },
  geo: { regions: geoRegions(colors) },
});
