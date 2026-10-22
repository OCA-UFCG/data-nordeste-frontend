import * as echarts from "echarts/core";
import { BarChart, LineChart, MapChart } from "echarts/charts";
import {
  AriaComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components";
import { SVGRenderer } from "echarts/renderers";

echarts.use([
  AriaComponent,
  BarChart,
  GridComponent,
  LegendComponent,
  LineChart,
  MapChart,
  SVGRenderer,
  TooltipComponent,
]);

export type ChartOption = echarts.EChartsCoreOption;
export type ChartInstance = echarts.ECharts;
type MapGeoJson = Parameters<typeof echarts.registerMap>[1];

export const createChart = (element: HTMLElement): ChartInstance =>
  echarts.init(element, undefined, { renderer: "svg" });

export const registerChartMapFeatures = (name: string, features: object[]) => {
  if (echarts.getMap(name)) return;

  const geoJson = { type: "FeatureCollection", features } as unknown;

  echarts.registerMap(name, geoJson as MapGeoJson);
};
