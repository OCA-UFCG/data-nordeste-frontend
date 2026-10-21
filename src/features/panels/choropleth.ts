export type ChoroplethBucket = { max: number; label: string; color: string };

export const getBucket = (
  buckets: readonly ChoroplethBucket[],
  value: number,
): ChoroplethBucket =>
  buckets.find(({ max }) => value < max) ?? buckets[buckets.length - 1];
