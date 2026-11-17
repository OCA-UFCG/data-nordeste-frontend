const STEPS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };

const targetIndex = (total: number, index: number, key: string) => {
  if (key === "Home") return 0;
  if (key === "End") return total - 1;
  if (key in STEPS) return index + STEPS[key];

  return -1;
};

/**
 * Categoria (ano) para onde uma tecla leva a partir da atual: setas andam uma,
 * Home e End vão às pontas. Null quando a tecla não muda nada.
 *
 * @example stepCategory(["2020", "2021"], "2020", "ArrowRight") // "2021"
 */
export const stepCategory = (
  categories: readonly string[],
  current: string,
  key: string,
): string | null => {
  const index = categories.indexOf(current);
  const target = targetIndex(categories.length, index, key);

  if (target < 0 || target === index) return null;

  return categories[target] ?? null;
};

const ARROW_KEYS = { ArrowLeft: true, ArrowRight: true };

const nearestYear = (years: readonly number[], ano: number, key: string) => {
  if (key === "ArrowLeft") return years.filter((year) => year < ano).at(-1);
  if (key === "ArrowRight") return years.find((year) => year > ano);

  return undefined;
};

/**
 * Ano para onde uma tecla leva num gráfico de linha anual. Quando o ano filtrado não está na
 * série, as setas vão ao ano vizinho mais próximo em vez de se perderem.
 *
 * @example stepYear([2019, 2021], 2020, "ArrowLeft") // 2019
 */
export const stepYear = (
  years: readonly number[],
  ano: number,
  key: string,
): number | null => {
  if (!years.includes(ano) && key in ARROW_KEYS) {
    return nearestYear(years, ano, key) ?? null;
  }
  const next = stepCategory(years.map(String), String(ano), key);

  return next === null ? null : Number(next);
};

/**
 * Índice do ano mais próximo do ponteiro numa área de `count` anos
 * igualmente espaçados. `pad`: a folga, em px, que a área tem de cada lado
 * além do primeiro e do último ponto (o IDH aumenta a área de clique).
 *
 * @example yearIndexAtPointer({ clientX: 150, left: 100, width: 100 }, 3) // 1
 */
export const yearIndexAtPointer = (
  { clientX, left, width }: { clientX: number; left: number; width: number },
  count: number,
  pad = 0,
): number => {
  const fraction = (clientX - left - pad) / (width - 2 * pad);

  return Math.min(count - 1, Math.max(0, Math.round(fraction * (count - 1))));
};
