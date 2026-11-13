import {
  capitalizeScale,
  formatReaisAxis,
  formatReaisCompact,
} from "@/features/panels/format";

/**
 * Valor em reais na escala do próprio número, como nos cards e rótulos do
 * painel do PIB.
 *
 * @example formatPibReais(1_513_055_000_000) // "R$ 1,51 Tri"
 */
export const formatPibReais = (value: number): string =>
  capitalizeScale(formatReaisCompact(value));

/**
 * Rótulo de eixo em reais: sem casas quando o valor é redondo na escala.
 *
 * @example formatPibAxis(400_000_000_000) // "R$ 400 Bi"
 */
export const formatPibAxis = (value: number): string =>
  capitalizeScale(formatReaisAxis(value));

const tick = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

/**
 * Marca do eixo das barras, já na unidade do gráfico (até duas casas).
 *
 * @example formatPibTick(0.3) // "0,3"
 */
export const formatPibTick = (value: number): string => tick.format(value);
