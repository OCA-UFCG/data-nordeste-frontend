// Medidas de texto do cartaz sem canvas: o SVG é montado como texto puro (e
// testado no jsdom, que não tem canvas 2D), então a largura é estimada por
// caractere. Sobra uma folga nos chamadores, que somam a margem.

const NARROW = new Set("iljtfI.,:;'| !()[]·-–/");
const WIDE = new Set("mwMW@%");
const ELLIPSIS = "…";

// Fração do tamanho da fonte, para a Inter de peso 400.
const WIDTH_EM = {
  narrow: 0.3,
  wide: 0.86,
  upper: 0.66,
  digit: 0.58,
  base: 0.54,
};

// Peso maior alarga a letra (600 e 700 da Inter).
const weightFactor = (weight: number) =>
  weight >= 700 ? 1.07 : weight >= 600 ? 1.04 : 1;

const charEm = (char: string): number => {
  if (NARROW.has(char)) return WIDTH_EM.narrow;
  if (WIDE.has(char)) return WIDTH_EM.wide;
  if (/[0-9]/.test(char)) return WIDTH_EM.digit;
  if (char !== char.toLowerCase()) return WIDTH_EM.upper;

  return WIDTH_EM.base;
};

/**
 * Largura estimada do texto em px.
 *
 * @example textWidth("Nordeste", 10, 400) // ~42
 */
export const textWidth = (text: string, size: number, weight: number): number =>
  [...text].reduce((sum, char) => sum + charEm(char), 0) *
  size *
  weightFactor(weight);

/**
 * Corta o texto com reticências para caber em `maxWidth`.
 *
 * @example truncateText("Observatório da Caatinga", 80, 10, 400) // "Observatório…"
 */
export const truncateText = (
  text: string,
  maxWidth: number,
  size: number,
  weight: number,
): string => {
  if (textWidth(text, size, weight) <= maxWidth) return text;
  const chars = [...text];

  while (chars.length > 0) {
    chars.pop();
    const candidate = `${chars.join("").trimEnd()}${ELLIPSIS}`;

    if (textWidth(candidate, size, weight) <= maxWidth) return candidate;
  }

  return ELLIPSIS;
};

/**
 * Quebra o texto por palavras em até `maxLines` linhas; o que sobrar vira
 * reticências na última.
 *
 * @example wrapWords("Mapa do porte populacional - Pernambuco", 200, 20, 700, 2)
 */
export const wrapWords = (
  text: string,
  maxWidth: number,
  size: number,
  weight: number,
  maxLines: number,
): string[] => {
  const lines: string[] = [];
  let current = "";

  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = current ? `${current} ${word}` : word;

    if (!current || textWidth(next, size, weight) <= maxWidth) current = next;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  return fitLines(lines, maxWidth, size, weight, maxLines);
};

// Mais linhas do que o limite: junta o resto na última e corta.
const fitLines = (
  lines: string[],
  maxWidth: number,
  size: number,
  weight: number,
  maxLines: number,
): string[] => {
  if (lines.length <= maxLines) {
    return lines.map((line) => truncateText(line, maxWidth, size, weight));
  }
  const kept = lines.slice(0, maxLines - 1);
  const rest = `${lines.slice(maxLines - 1).join(" ")}${ELLIPSIS}`;

  return [
    ...kept.map((line) => truncateText(line, maxWidth, size, weight)),
    truncateText(rest, maxWidth, size, weight),
  ];
};

/**
 * Distribui itens em linhas de até `maxWidth`, com `gap` entre eles. Um item
 * mais largo que a linha fica sozinho. Devolve os índices de cada linha.
 *
 * @example flowRows([{ width: 40 }, { width: 40 }, { width: 40 }], 90, 5) // [[0, 1], [2]]
 */
export const flowRows = (
  items: readonly { width: number }[],
  maxWidth: number,
  gap: number,
): number[][] => {
  const rows: number[][] = [];
  let used = 0;

  items.forEach((item, index) => {
    const needed = rows.length && used > 0 ? gap + item.width : item.width;

    if (!rows.length || used + needed > maxWidth) {
      rows.push([index]);
      used = item.width;

      return;
    }
    rows[rows.length - 1].push(index);
    used += needed;
  });

  return rows;
};
