const SCALES = [
  { limit: 1e12, suffix: "tri" },
  { limit: 1e9, suffix: "bi" },
  { limit: 1e6, suffix: "mi" },
  { limit: 1e3, suffix: "mil" },
] as const;

const decimal = (digits: number) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export const formatReaisCompact = (value: number, digits = 2): string => {
  const scale = SCALES.find(({ limit }) => Math.abs(value) >= limit);

  if (!scale) return `R$ ${decimal(0).format(value)}`;

  return `R$ ${decimal(digits).format(value / scale.limit)} ${scale.suffix}`;
};

export const formatPercent = (value: number, digits = 1): string =>
  `${decimal(digits).format(value)}%`;

export const formatReaisAxis = (value: number): string => {
  const scale = SCALES.find(({ limit }) => Math.abs(value) >= limit);
  const isWhole = !scale || Number.isInteger(value / scale.limit);

  return formatReaisCompact(value, isWhole ? 0 : 1);
};
