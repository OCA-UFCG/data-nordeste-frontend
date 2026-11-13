/**
 * Caminho SVG de uma linha a partir dos pontos, com uma casa decimal (o
 * suficiente na tela e menos texto no SVG baixado). Usado pelas linhas
 * desenhadas à mão dos painéis (IDH e perfil demográfico).
 *
 * @example linePath([{ x: 0, y: 10 }, { x: 5, y: 8 }]) // "M0.0 10.0L5.0 8.0"
 */
export const linePath = (points: readonly { x: number; y: number }[]): string =>
  points
    .map(
      ({ x, y }, index) =>
        `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`,
    )
    .join("");
