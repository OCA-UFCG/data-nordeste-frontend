import * as echarts from "echarts/core";
import { BarChart, LineChart, MapChart, PieChart } from "echarts/charts";
import {
  AriaComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer, SVGRenderer } from "echarts/renderers";

echarts.use([
  AriaComponent,
  BarChart,
  CanvasRenderer,
  GridComponent,
  LegendComponent,
  LineChart,
  MapChart,
  PieChart,
  SVGRenderer,
  TooltipComponent,
]);

export type ChartOption = echarts.EChartsCoreOption;
export type ChartInstance = echarts.ECharts;
type MapGeoJson = Parameters<typeof echarts.registerMap>[1];

export type ChartRenderer = "svg" | "canvas";

export const createChart = (
  element: HTMLElement,
  renderer: ChartRenderer = "svg",
): ChartInstance => echarts.init(element, undefined, { renderer });

export const registerChartMapFeatures = (name: string, features: object[]) => {
  if (echarts.getMap(name)) return;

  const geoJson = { type: "FeatureCollection", features } as unknown;

  echarts.registerMap(name, geoJson as MapGeoJson);
};
