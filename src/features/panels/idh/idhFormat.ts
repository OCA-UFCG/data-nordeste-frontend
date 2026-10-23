import { formatNumber, formatReais } from "@/features/panels/format";

export const IDH_COLORS = ["#f5791a", "#fabd77"] as const;
export const NO_DATA = "Sem dados";

// Cards seguem o Figma ("0,70"); gráficos mantêm 3 casas para a série anual
// não repetir o mesmo rótulo em anos vizinhos.
export const formatIdhCard = (value: number) => formatNumber(value, 2);
export const formatIdh = (value: number) => formatNumber(value, 3);
export const formatRenda = (value: number) => formatReais(value);

// Rótulo de coluna sem "R$" e sem casas: "R$ 1,14 mil" não cabe sobre a barra.
// O título do gráfico indica a unidade.
export const formatRendaLabel = (value: number) => formatNumber(value);

export const yearLabels = (points: { ano: number }[]) =>
  points.map((point) => String(point.ano));
