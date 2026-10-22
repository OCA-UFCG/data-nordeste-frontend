import {
  formatNumber,
  formatReais,
  formatReaisCompact,
} from "@/features/panels/format";

export const IDH_COLORS = ["#f5791a", "#fabd77"] as const;
export const NO_DATA = "Sem dados";

// Cards seguem o Figma ("0,70"); gráficos mantêm 3 casas para a série anual
// não repetir o mesmo rótulo em anos vizinhos.
export const formatIdhCard = (value: number) => formatNumber(value, 2);
export const formatIdh = (value: number) => formatNumber(value, 3);
export const formatRenda = (value: number) => formatReais(value);
export const formatRendaLabel = (value: number) => formatReaisCompact(value);

export const yearLabels = (points: { ano: number }[]) =>
  points.map((point) => String(point.ano));
