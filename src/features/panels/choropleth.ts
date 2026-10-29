export type ChoroplethBucket = { max: number; label: string; color: string };

export const getBucket = (
  buckets: readonly ChoroplethBucket[],
  value: number,
): ChoroplethBucket =>
  buckets.find(({ max }) => value < max) ?? buckets[buckets.length - 1];

/**
 * Posição de cada região no ranking do filtro, do maior valor para o menor.
 * Valores iguais dividem a posição (1º, 2º, 2º, 4º).
 *
 * @example rankRegions([{ code: "a", value: 5 }, { code: "b", value: 9 }]) // Map { "b" => 1, "a" => 2 }
 */
export const rankRegions = (
  regions: readonly { code: string; value: number }[],
): Map<string, number> => {
  const sorted = [...regions].sort((a, b) => b.value - a.value);
  const ranks = new Map<string, number>();

  sorted.forEach((region, index) => {
    const previous = sorted[index - 1];
    const tied = previous && previous.value === region.value;

    ranks.set(region.code, tied ? ranks.get(previous.code)! : index + 1);
  });

  return ranks;
};
