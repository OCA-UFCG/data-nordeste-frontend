import { dropFloatNoise } from "@/features/panels/floatNoise";

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

// `reference` fixa a escala: com o máximo da série, todos os rótulos saem na
// mesma unidade ("R$ 0,52 tri" ... "R$ 1,51 tri", como no Power BI do PIB).
export const formatNumberCompact = (
  value: number,
  digits = 2,
  reference = value,
): string => {
  const scale = SCALES.find(({ limit }) => Math.abs(reference) >= limit);

  if (!scale) return decimal(0).format(value);

  return `${decimal(digits).format(value / scale.limit)} ${scale.suffix}`;
};

export const formatReaisCompact = (
  value: number,
  digits = 2,
  reference = value,
): string => `R$ ${formatNumberCompact(value, digits, reference)}`;

// Unidade com inicial maiúscula, como nos rótulos do Power BI ("R$ 1,51 Tri").
export const capitalizeScale = (text: string): string =>
  text.replace(/ (tri|bi|mi|mil)$/, (match) =>
    match.replace(/ (\w)/, (_, letter: string) => ` ${letter.toUpperCase()}`),
  );

export const formatNumber = (value: number, digits = 0): string =>
  decimal(digits).format(value);

// Contagem de pessoas. Wrapper de um argumento: o ECharts passa o índice como
// segundo, que formatNumber leria como casas decimais.
export const formatPessoas = (value: number): string => formatNumber(value);

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

/**
 * Rótulo compacto com as casas que o passo pede na escala do valor: ticks a
 * cada 200 mil saem "1,6 mi" e "1,8 mi", nunca dois "2 mi" (revisão da PR #400).
 *
 * @example formatNumberForStep(1_800_000, 200_000) // "1,8 mi"
 */
export const formatNumberForStep = (value: number, step: number): string => {
  const scale = SCALES.find(({ limit }) => Math.abs(value) >= limit);
  const ratio = dropFloatNoise(step / (scale?.limit ?? 1));
  const fraction = String(ratio).split(".")[1] ?? "";

  return formatNumberCompact(value, Math.min(fraction.length, 3));
};
