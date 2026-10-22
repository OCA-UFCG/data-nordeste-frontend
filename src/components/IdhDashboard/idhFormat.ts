import {
  formatNumber,
  formatReais,
  formatReaisCompact,
} from "@/features/panels/format";

export const IDH_COLORS = ["#f5791a", "#fabd77"] as const;
export const NO_DATA = "Sem dados";

export const formatIdh = (value: number) => formatNumber(value, 3);
export const formatRenda = (value: number) => formatReais(value);
export const formatRendaLabel = (value: number) => formatReaisCompact(value);

export const yearLabels = (points: { ano: number }[]) =>
  points.map((point) => String(point.ano));
