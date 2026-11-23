import { formatNumber } from "@/features/panels/format";

export type AreaUnit = { divisor: number; suffix: string };

const MILLION: AreaUnit = { divisor: 1e6, suffix: " Mi" };
const THOUSAND: AreaUnit = { divisor: 1e3, suffix: " mil" };
const ONE: AreaUnit = { divisor: 1, suffix: "" };

/**
 * Unidade de uma área a partir do maior valor (`unitOf` do protótipo): de 100
 * mil km² para cima sai em milhões, de mil para cima em milhares.
 *
 * @example areaUnit(1_550_000).suffix // " Mi"
 */
export const areaUnit = (highest: number): AreaUnit => {
  if (highest >= 1e5) return MILLION;
  if (highest >= 1e3) return THOUSAND;

  return ONE;
};

// Milhões com duas casas; milhares com uma abaixo de 100 mil, sem casa acima.
const digitsFor = (scaled: number, unit: AreaUnit): number => {
  if (unit === MILLION) return 2;
  if (unit === THOUSAND && scaled < 100) return 1;

  return 0;
};

/**
 * Área compacta, sem a unidade de medida (`fKm` do protótipo). `unit` fixa a
 * escala, para os rótulos de um mesmo gráfico saírem na mesma unidade.
 *
 * @example formatAreaCompact(774_300) // "0,77 Mi"
 */
export const formatAreaCompact = (
  value: number,
  unit: AreaUnit = areaUnit(value),
): string => {
  const scaled = value / unit.divisor;

  return `${formatNumber(scaled, digitsFor(scaled, unit))}${unit.suffix}`;
};

// Espaço não separável: o número e o "km²" não quebram em linhas diferentes.
const KM2 = "\u00a0km²";

/**
 * Área compacta com "km²" (`fKm2` do protótipo).
 *
 * @example formatAreaKm2(12_400) // "12,4 mil km²"
 */
export const formatAreaKm2 = (value: number): string =>
  `${formatAreaCompact(value)}${KM2}`;

/**
 * Área por extenso, com duas casas, para o texto do "Veja mais".
 *
 * @example formatAreaKm2Full(1234.5) // "1.234,50 km²"
 */
export const formatAreaKm2Full = (value: number): string =>
  `${formatNumber(value, 2)}${KM2}`;

/**
 * Percentual com duas casas (`fP` do protótipo).
 *
 * @example formatSharePercent(59.8) // "59,80%"
 */
export const formatSharePercent = (value: number): string =>
  `${formatNumber(value, 2)}%`;

const TICK = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

/**
 * Rótulo do eixo de áreas: o valor já na unidade do eixo, até duas casas.
 *
 * @example formatAreaTick(0.2, areaUnit(774_000)) // "0,2 Mi"
 */
export const formatAreaTick = (tick: number, unit: AreaUnit): string =>
  tick === 0 ? "0" : `${TICK.format(tick)}${unit.suffix}`;
