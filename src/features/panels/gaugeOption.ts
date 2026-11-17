import {
  baseOption,
  TEXT_COLOR,
  type ValueFormatter,
} from "@/features/panels/chartBase";
import type { ChartOption } from "@/lib/echarts";

export type GaugeConfig = {
  name: string;
  value: number;
  max: number;
  color: string;
  formatValue: ValueFormatter;
};

const TRACK_COLOR = "#f3f2f1";

const gaugeArc = (config: GaugeConfig, thickness: number) => ({
  progress: {
    show: true,
    width: thickness,
    itemStyle: { color: config.color },
  },
  axisLine: { lineStyle: { width: thickness, color: [[1, TRACK_COLOR]] } },
  pointer: { show: false },
  axisTick: { show: false },
  splitLine: { show: false },
});

// O ECharts prende o rótulo à ponta do arco (descontando 10 px da splitLine,
// mesmo oculta); a distância o centra sob o arco e o "\n" o desce abaixo dele.
const END_LABEL_HALF_WIDTH = 12;

const gaugeAxisLabel = (config: GaugeConfig, thickness: number) => ({
  distance: thickness / 2 - 10 - END_LABEL_HALF_WIDTH,
  fontSize: 12,
  lineHeight: 32,
  color: TEXT_COLOR,
  formatter: (value: number) =>
    value === 0 || value === config.max ? `\n${config.formatValue(value)}` : "",
});

/**
 * Meio arco de 0 ao máximo com o valor no centro e o nome abaixo: o "Medidor"
 * do Power BI.
 *
 * @example buildGaugeOption({ name: "Homem", value: 0.74, max: 1, color: "#97B42E", formatValue: String }, 280)
 */
export const buildGaugeOption = (
  config: GaugeConfig,
  width: number,
): ChartOption => {
  const thickness = Math.max(Math.round(width * 0.12), 14);

  return {
    ...baseOption(),
    tooltip: { show: false },
    series: [
      {
        id: "gauge",
        type: "gauge",
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: config.max,
        splitNumber: 1,
        radius: "90%",
        center: ["50%", "68%"],
        ...gaugeArc(config, thickness),
        axisLabel: gaugeAxisLabel(config, thickness),
        title: {
          offsetCenter: [0, "40%"],
          fontSize: 14,
          fontWeight: 700,
          color: TEXT_COLOR,
        },
        detail: {
          offsetCenter: [0, "-18%"],
          fontSize: Math.min(Math.max(Math.round(width / 7), 20), 36),
          fontWeight: 500,
          color: TEXT_COLOR,
          formatter: config.formatValue,
        },
        data: [{ value: config.value, name: config.name }],
      },
    ],
  };
};
