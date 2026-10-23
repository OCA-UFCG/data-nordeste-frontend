import { describe, expect, it } from "vitest";
import { createQueryCache } from "@/lib/queryCache";

class SqlRunnerFake {
  calls = 0;
  failNext = false;

  readonly query = async <Row>(sql: string, params: unknown[]) => {
    this.calls += 1;
    if (this.failNext) {
      this.failNext = false;
      throw new Error(`Query failed for "${sql}".`);
    }

    return [{ sql, params, call: this.calls }] as Row[];
  };
}

class ClockFake {
  current = 0;
  readonly now = () => this.current;
}

const setup = (maxEntries = 10) => {
  const runner = new SqlRunnerFake();
  const clock = new ClockFake();
  const cached = createQueryCache({
    query: runner.query,
    ttlMs: 1000,
    maxEntries,
    now: clock.now,
  });

  return { runner, clock, cached };
};

describe("createQueryCache", () => {
  it("reuses rows for the same SQL and parameters until they expire", async () => {
    const { runner, clock, cached } = setup();

    await cached("SELECT 1", [2025]);
    await cached("SELECT 1", [2025]);
    expect(runner.calls).toBe(1);

    await cached("SELECT 1", [2024]);
    expect(runner.calls).toBe(2);

    clock.current = 1001;
    await cached("SELECT 1", [2025]);
    expect(runner.calls).toBe(3);
  });

  it("shares one round trip between concurrent identical queries", async () => {
    const { runner, cached } = setup();

    await Promise.all([cached("SELECT 1", []), cached("SELECT 1", [])]);

    expect(runner.calls).toBe(1);
  });

  it("does not keep a failed query", async () => {
    const { runner, cached } = setup();

    runner.failNext = true;
    await expect(cached("SELECT 1", [])).rejects.toThrow('"SELECT 1"');
    await cached("SELECT 1", []);

    expect(runner.calls).toBe(2);
  });

  it("drops the least recently used entry past the size limit", async () => {
    const { runner, cached } = setup(2);

    await cached("A", []);
    await cached("B", []);
    await cached("A", []);
    await cached("C", []);
    await cached("A", []);
    expect(runner.calls).toBe(3);

    await cached("B", []);
    expect(runner.calls).toBe(4);
  });
});
