import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchExploreResults } from "@/features/explore/results";
import { GET } from "./route";

vi.mock("@/features/explore/results", () => ({
  fetchExploreResults: vi.fn(),
}));

describe("GET /api/explore", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns the aggregated explore result", async () => {
    vi.mocked(fetchExploreResults).mockResolvedValue({
      items: [],
      total: 0,
      totalPages: 0,
      tabTotals: { dashboards: 1, datastories: 0, publications: 2 },
    });

    const response = await GET(
      new NextRequest("http://localhost/api/explore?page=invalid"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ total: 0, totalPages: 0 });
    expect(fetchExploreResults).toHaveBeenCalledOnce();
  });

  it("returns a stable gateway error when Contentful fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(fetchExploreResults).mockRejectedValue(new Error("offline"));

    const response = await GET(new NextRequest("http://localhost/api/explore"));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "Não foi possível carregar os resultados de exploração.",
    });
  });
});
