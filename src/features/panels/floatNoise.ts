/**
 * Tira o ruído de ponto flutuante das contas de eixo (passo × índice), para
 * os ticks saírem redondos nos rótulos. 12 algarismos sobram para qualquer
 * valor dos painéis.
 *
 * @example dropFloatNoise(0.1 + 0.2) // 0.3
 */
export const dropFloatNoise = (value: number): number =>
  Number(value.toPrecision(12));
