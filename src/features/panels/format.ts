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

export const formatNumberCompact = (value: number, digits = 2): string => {
  const scale = SCALES.find(({ limit }) => Math.abs(value) >= limit);

  if (!scale) return decimal(0).format(value);

  return `${decimal(digits).format(value / scale.limit)} ${scale.suffix}`;
};

export const formatReaisCompact = (value: number, digits = 2): string =>
  `R$ ${formatNumberCompact(value, digits)}`;

export const formatNumber = (value: number, digits = 0): string =>
  decimal(digits).format(value);

export const formatReais = (value: number): string =>
  `R$ ${decimal(2).format(value)}`;

export const formatPercent = (value: number, digits = 1): string =>
  `${decimal(digits).format(value)}%`;

// Eixo: sem casas quando o valor é redondo na escala ("2 mi"), uma quando não.
export const formatNumberAxis = (value: number): string => {
  const scale = SCALES.find(({ limit }) => Math.abs(value) >= limit);
  const isWhole = !scale || Number.isInteger(value / scale.limit);

  return formatNumberCompact(value, isWhole ? 0 : 1);
};

export const formatReaisAxis = (value: number): string =>
  `R$ ${formatNumberAxis(value)}`;
