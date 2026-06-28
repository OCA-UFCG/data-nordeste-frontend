import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExploreResults } from "./ExploreResults";
import type { ExploreResults as ExploreResultsState } from "@/features/explore/contract";
import type { SearchIndexItem } from "@/features/search/types";

const searchParams = vi.hoisted(() => ({ value: new URLSearchParams() }));
const replaceQuery = vi.hoisted(() => vi.fn());
const indexClient = vi.hoisted(() => ({
  cached: null as SearchIndexItem[] | null,
  load: vi.fn<() => Promise<SearchIndexItem[]>>(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams.value,
}));
vi.mock("@/features/explore/navigation", () => ({
  useExploreNavigation: () => ({ replaceQuery }),
}));
vi.mock("@/features/search/clientIndex", () => ({
  getCachedSearchIndexItems: () => indexClient.cached,
  loadSearchIndexItems: () => indexClient.load(),
  resetSearchIndexCache: vi.fn(),
}));
vi.mock("@/components/MacroThemeTabs/MacroThemeTabs", () => ({
  MacroThemeTabs: () => <div>tabs</div>,
}));
vi.mock("@/components/PostsGrid/PostsGrid", () => ({
  PostsGrid: ({ posts }: { posts: { title: string }[] }) => (
    <div>{posts.map((post) => post.title).join(",")}</div>
  ),
}));

const initialResults: ExploreResultsState = {
  items: [
    {
      sys: { id: "initial" },
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

const localPost: SearchIndexItem = {
  id: "post:local",
  source: "post",
  type: "data-panel",
  title: "Economia local",
  description: "PIB regional",
  href: "/painel",
  date: "2026-01-01",
  thumb: "/thumb.png",
  themes: ["Economia"],
  tags: [],
  text: "economia local pib regional",
  explorePost: {
    contentfulId: "local",
    link: "/painel",
    themeIds: ["theme-economia"],
  },
};

describe("ExploreResults", () => {
  afterEach(() => {
    searchParams.value = new URLSearchParams();
    indexClient.cached = null;
    indexClient.load.mockReset();
    replaceQuery.mockClear();
  });

  it("preserves SSR cards until the local index is available", async () => {
    let resolveIndex: (items: SearchIndexItem[]) => void = () => undefined;
    indexClient.load.mockReturnValue(
      new Promise((resolve) => {
        resolveIndex = resolve;
      }),
    );
    render(<ExploreResults headers={{}} initialResults={initialResults} />);

    expect(screen.getByText("Inicial")).toBeInTheDocument();
    await act(async () => resolveIndex([localPost]));

    expect(screen.getByText("Economia local")).toBeInTheDocument();
    expect(screen.queryByText("Inicial")).not.toBeInTheDocument();
  });

  it("filters locally after URL search changes without requesting explore API", () => {
    indexClient.cached = [localPost];
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const view = render(
      <ExploreResults headers={{}} initialResults={initialResults} />,
    );

    searchParams.value = new URLSearchParams("q=inexistente");
    view.rerender(
      <ExploreResults headers={{}} initialResults={initialResults} />,
    );

    expect(screen.queryByText("Economia local")).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
