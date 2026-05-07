import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Posts } from "./Posts";
import { getContent } from "@/utils/contentful";

const replace = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/posts",
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams("page=1"),
}));

vi.mock("@/utils/contentful", () => ({
  getContent: vi.fn(),
}));

vi.mock("../PostsGrid/FilterForm", () => ({
  FilterForm: () => <div>filters</div>,
}));

vi.mock("../PostsGrid/PostsGrid", () => ({
  PostsGrid: () => <div>posts grid</div>,
}));

vi.mock("../PostsGrid/SortSelect", () => ({
  SortSelect: () => <div>sort</div>,
}));

describe("Posts", () => {
  it("renders server-provided posts on mount without replacing the current route", async () => {
    vi.mocked(getContent).mockResolvedValue({
      postCollection: {
        total: 1,
        items: [],
      },
    });

    render(
      <Posts
        header={{ id: "posts-content", title: "Posts", subtitle: "" }}
        totalPages={1}
        initialPosts={[]}
        rootFilter={{ type_in: ["newsletter"] }}
        categories={{
          title: "Tipo",
          type: "type_in",
          fields: { newsletter: "Boletim" },
        }}
      />,
    );

    await waitFor(() => expect(getContent).not.toHaveBeenCalled());
    expect(replace).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
