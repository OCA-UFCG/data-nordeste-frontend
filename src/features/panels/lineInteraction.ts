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
