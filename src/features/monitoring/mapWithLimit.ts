/**
 * Maps the items with `run`, never running more than `limit` at once, and
 * returns the results in the order of the items.
 *
 * Usage: await mapWithLimit(["a", "b", "c"], 2, async (x) => x.toUpperCase()) => ["A", "B", "C"]
 */
export async function mapWithLimit<Item, Result>(
  items: readonly Item[],
  limit: number,
  run: (item: Item) => Promise<Result>,
): Promise<Result[]> {
  const results: Result[] = new Array(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await run(items[index]);
    }
  };
  const workers = Math.min(Math.max(limit, 1), items.length);
  await Promise.all(Array.from({ length: workers }, worker));

  return results;
}
