"use client";

import { useCallback } from "react";
import { EChart } from "@/components/EChart/EChart";
import {
  buildGaugeOption,
  type GaugeConfig,
} from "@/features/panels/gaugeOption";

export const GaugeChart = ({
  label,
  className = "h-48 w-full sm:h-56",
  ...config
}: GaugeConfig & { label: string; className?: string }) => {
  const { name, value, max, color, formatValue } = config;
  const buildOption = useCallback(
    (width: number) =>
      buildGaugeOption({ name, value, max, color, formatValue }, width),
    [name, value, max, color, formatValue],
  );

  return (
    <EChart buildOption={buildOption} label={label} className={className} />
  );
};
