import { describe, expect, it } from "vitest";
import { mapWithLimit } from "./mapWithLimit";

/** Counts how many runs overlap; each one yields to the event loop before it ends. */
class OverlapProbe {
  running = 0;
  peak = 0;

  readonly run = async (item: number) => {
    this.running++;
    this.peak = Math.max(this.peak, this.running);
    await new Promise((resolve) => setTimeout(resolve, 0));
    this.running--;

    return item * 2;
  };
}

describe("mapWithLimit", () => {
  it("never runs more than the limit at once, and runs every item", async () => {
    const probe = new OverlapProbe();
    const items = Array.from({ length: 20 }, (_, index) => index);

    const results = await mapWithLimit(items, 6, probe.run);

    expect(probe.peak).toBe(6);
    expect(results).toHaveLength(20);
  });

  it("returns the results in the order of the items", async () => {
    const results = await mapWithLimit([3, 1, 2], 2, new OverlapProbe().run);

    expect(results).toEqual([6, 2, 4]);
  });

  it("copes with no items and with a limit above the item count", async () => {
    const probe = new OverlapProbe();

    expect(await mapWithLimit([], 6, probe.run)).toEqual([]);
    expect(await mapWithLimit([1, 2], 6, probe.run)).toEqual([2, 4]);
    expect(probe.peak).toBe(2);
  });
});
