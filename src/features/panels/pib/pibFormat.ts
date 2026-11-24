import { capitalizeScale, formatReaisCompact } from "@/features/panels/format";
import type { PibBarUnit } from "@/features/panels/pib/pibBars";

/**
 * Valor em reais na escala do próprio número, como nos cards e rótulos do
 * painel do PIB.
 *
 * @example formatPibReais(1_513_055_000_000) // "R$ 1,51 Tri"
 */
export const formatPibReais = (value: number): string =>
  capitalizeScale(formatReaisCompact(value));

const tick = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

/**
 * Marca do eixo das barras, já na unidade do gráfico (até duas casas).
 *
 * @example formatPibTick(0.3) // "0,3"
 */
export const formatPibTick = (value: number): string => tick.format(value);

/**
 * Marca de eixo sem "R$" nem escala: a unidade vai no título do eixo.
 *
 * @example formatPibAxis(1_600_000_000_000, { divisor: 1e9, label: "bilhões" }) // "1.600"
 */
export const formatPibAxis = (value: number, unit: PibBarUnit): string =>
  formatPibTick(value / unit.divisor);
