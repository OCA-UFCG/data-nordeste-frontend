import { afterEach, describe, expect, it, vi } from "vitest";
import {
  loadDemografiaYearRange,
  NO_DEMOGRAFIA_YEARS,
  tryLoadDemografiaYearRange,
} from "@/features/panels/demografia/demografiaYearRange";
import { listYears } from "@/features/panels/territorialFilters";
import type { SqlQuery } from "@/features/panels/territorialSql";

const queryReturning =
  (rows: object[]): SqlQuery =>
  async <Row>() =>
    rows as Row[];

const failingQuery: SqlQuery = async () => {
  throw new Error("connect ECONNREFUSED 127.0.0.1:5433");
};

describe("loadDemografiaYearRange", () => {
  it("lists the census years from the table, newest first", async () => {
    const calls: string[] = [];
    const query: SqlQuery = async <Row>(sql: string) => {
      calls.push(sql);

      return [{ ano: "2022" }, { ano: 2010 }, { ano: 2000 }] as Row[];
    };

    expect(await loadDemografiaYearRange(query)).toEqual({
      first: 2000,
      last: 2022,
      available: [2022, 2010, 2000],
    });
    expect(calls[0]).toContain("dem_demografia.final_demografia");
  });

  it("rejects an empty table instead of inventing a year", async () => {
    await expect(loadDemografiaYearRange(queryReturning([]))).rejects.toThrow(
      /expected at least one integer ano/,
    );
  });
});

describe("tryLoadDemografiaYearRange", () => {
  afterEach(() => vi.restoreAllMocks());

  it("logs a JSON event and returns null when the query fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await tryLoadDemografiaYearRange(failingQuery)).toBeNull();
    expect(JSON.parse(log.mock.calls[0][0])).toEqual({
      event: "demografia_demo_year_range_failed",
      message: "connect ECONNREFUSED 127.0.0.1:5433",
    });
  });

  it("offers no year in the fallback range", () => {
    expect(listYears(NO_DEMOGRAFIA_YEARS)).toEqual([]);
  });
});
