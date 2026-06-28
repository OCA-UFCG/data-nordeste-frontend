import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExploreResults } from "./ExploreResults";
import type { ExploreResults as ExploreResultsState } from "@/features/explore/contract";

const searchParams = vi.hoisted(() => ({ value: new URLSearchParams() }));
const replaceQuery = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams.value,
}));
vi.mock("@/features/explore/navigation", () => ({
  useExploreNavigation: () => ({ replaceQuery }),
}));
vi.mock("@/components/MacroThemeTabs/MacroThemeTabs", () => ({
  MacroThemeTabs: () => <div>tabs</div>,
}));
vi.mock("@/components/PostsGrid/PostsGrid", () => ({
  PostsGrid: ({
    posts,
    loading,
  }: {
    posts: { title: string }[];
    loading: boolean;
  }) => (
    <div data-loading={loading}>
      {posts.map((post) => post.title).join(",")}
    </div>
  ),
}));

const initialResults: ExploreResultsState = {
  items: [
    {
      title: "Inicial",
      link: "",
      thumb: { url: "" },
      type: "data-panel",
      date: "",
      description: "",
    },
  ],
  total: 1,
  totalPages: 1,
  tabTotals: { dashboards: 1, datastories: 1, publications: 1 },
};

function successfulResponse(title: string): Response {
  return new Response(
    JSON.stringify({
      ...initialResults,
      items: [
        {
          title,
          link: "",
          thumb: { url: "" },
          type: "data-panel",
          date: "",
          description: "",
        },
      ],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

describe("ExploreResults", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    searchParams.value = new URLSearchParams();
    replaceQuery.mockClear();
  });

  it("keeps old cards and ignores an obsolete request", async () => {
    vi.useFakeTimers();
    const resolvers: ((response: Response) => void)[] = [];
    const fetchResults = vi.fn(
      () => new Promise<Response>((resolve) => resolvers.push(resolve)),
    );
    vi.stubGlobal("fetch", fetchResults);
    const view = render(
      <ExploreResults headers={{}} initialResults={initialResults} />,
    );

    searchParams.value = new URLSearchParams("q=old");
    view.rerender(
      <ExploreResults headers={{}} initialResults={initialResults} />,
    );
    await act(() => vi.advanceTimersByTimeAsync(120));
    searchParams.value = new URLSearchParams("q=new");
    view.rerender(
      <ExploreResults headers={{}} initialResults={initialResults} />,
    );
    await act(() => vi.advanceTimersByTimeAsync(120));

    expect(fetchResults).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Inicial")).toHaveAttribute("data-loading", "true");
    await act(async () => resolvers[1](successfulResponse("Novo")));
    await act(async () => resolvers[0](successfulResponse("Antigo")));

    expect(screen.getByText("Novo")).toBeInTheDocument();
    expect(screen.queryByText("Antigo")).not.toBeInTheDocument();
  });
});
