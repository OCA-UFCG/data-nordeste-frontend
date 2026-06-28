import { describe, expect, it } from "vitest";
import { EXPLORE_RESULTS_QUERY } from "@/utils/queries";
import { fetchExploreResults } from "./results";

class FakeExploreContentfulClient {
  calls: { query: string; variables: object | undefined }[] = [];

  request = async <T>(query: string, variables?: object): Promise<T> => {
    this.calls.push({ query, variables });

    return {
      activePosts: { total: 13, items: [{ title: "Painel" }] },
      dashboards: { total: 13 },
      datastories: { total: 2 },
      publications: { total: 4 },
    } as T;
  };
}

describe("fetchExploreResults", () => {
  it("loads cards and all tab totals with one Contentful operation", async () => {
    const fakeClient = new FakeExploreContentfulClient();
    const params = new URLSearchParams(
      "type_in=data-story&category=theme-a&page=2",
    );

    const result = await fetchExploreResults(params, fakeClient.request);

    expect(fakeClient.calls).toHaveLength(1);
    expect(fakeClient.calls[0].query).toBe(EXPLORE_RESULTS_QUERY);
    expect(fakeClient.calls[0].variables).toMatchObject({
      skip: 12,
      activeFilter: { type_in: "data-story" },
      dashboardsFilter: { type_in: "data-panel" },
    });
    expect(result.totalPages).toBe(2);
    expect(result.tabTotals).toEqual({
      dashboards: 13,
      datastories: 2,
      publications: 4,
    });
  });

  it("defaults invalid page and sorting values", async () => {
    const fakeClient = new FakeExploreContentfulClient();

    await fetchExploreResults(
      new URLSearchParams("page=-4&sort=invalid"),
      fakeClient.request,
    );

    expect(fakeClient.calls[0].variables).toMatchObject({
      skip: 0,
      order: "date_DESC",
    });
  });
});
