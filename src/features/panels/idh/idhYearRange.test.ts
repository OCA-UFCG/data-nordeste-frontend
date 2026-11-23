import { afterEach, describe, expect, it, vi } from "vitest";
import {
  loadIdhYearRange,
  NO_IDH_YEARS,
  tryLoadIdhYearRange,
} from "@/features/panels/idh/idhYearRange";
import { listYears } from "@/features/panels/territorialFilters";
import type { SqlQuery } from "@/features/panels/territorialSql";

const queryReturning =
  (rows: object[]): SqlQuery =>
  async <Row>() =>
    rows as Row[];

const failingQuery: SqlQuery = async () => {
  throw new Error("connect ECONNREFUSED 127.0.0.1:5433");
};

describe("loadIdhYearRange", () => {
  it("reads min and max year from the general view", async () => {
    const calls: string[] = [];
    const query: SqlQuery = async <Row>(sql: string) => {
      calls.push(sql);

      return [{ primeiro: 2012, ultimo: 2021 }] as Row[];
    };

    expect(await loadIdhYearRange(query)).toEqual({ first: 2012, last: 2021 });
    expect(calls[0]).toContain("MIN(ano)");
    expect(calls[0]).toContain("des_idh.idh_geral_novo_view");
  });

  it("converts numeric strings", async () => {
    const query = queryReturning([{ primeiro: "2010", ultimo: "2023" }]);

    expect(await loadIdhYearRange(query)).toEqual({ first: 2010, last: 2023 });
  });

  it("rejects an empty view instead of inventing a year", async () => {
    await expect(
      loadIdhYearRange(queryReturning([{ primeiro: null, ultimo: null }])),
    ).rejects.toThrow(/\{"primeiro":null,"ultimo":null\}.*expected integer/);
    await expect(loadIdhYearRange(queryReturning([]))).rejects.toThrow(
      /expected integer/,
    );
  });
});

describe("tryLoadIdhYearRange", () => {
  afterEach(() => vi.restoreAllMocks());

  it("logs a JSON event and returns null when the query fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await tryLoadIdhYearRange(failingQuery)).toBeNull();
    expect(JSON.parse(log.mock.calls[0][0])).toEqual({
      event: "idh_demo_year_range_failed",
      message: "connect ECONNREFUSED 127.0.0.1:5433",
    });
  });

  it("offers no year in the fallback range", () => {
    expect(listYears(NO_IDH_YEARS)).toEqual([]);
  });
});
