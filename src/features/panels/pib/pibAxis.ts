export type ZeroAxis = { max: number; step: number; ticks: number[] };

// Multiplicadores "redondos" do passo, os mesmos do protótipo.
const STEP_FACTORS = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

const INTERVALS = 4;

// Tira o ruído de ponto flutuante (0.30000000000000004 vira 0.3).
const exact = (value: number): number => Number(value.toPrecision(6));

/**
 * Eixo que começa em zero e cobre `highest` em quatro intervalos de passo
 * redondo (`nice` do protótipo do PIB). Sem valor positivo, devolve 0 a 4.
 *
 * @example buildZeroAxis(1513) // { max: 1600, step: 400, ticks: [0, 400, 800, 1200, 1600] }
 */
export const buildZeroAxis = (highest: number): ZeroAxis => {
  const step = highest > 0 ? roundStep(highest / INTERVALS) : 1;

  return {
    step,
    max: exact(step * INTERVALS),
    ticks: Array.from({ length: INTERVALS + 1 }, (_, index) =>
      exact(step * index),
    ),
  };
};

// O 0,9999 aceita o passo quando o valor cai exatamente em cima dele.
const roundStep = (raw: number): number => {
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const factor =
    STEP_FACTORS.find((item) => item * magnitude >= raw * 0.9999) ?? 10;

  return exact(factor * magnitude);
};
