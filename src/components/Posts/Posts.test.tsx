import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Posts } from "./Posts";
import { getContent } from "@/utils/contentful";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("page=1"),
}));

vi.mock("@/utils/contentful", () => ({
  getContent: vi.fn(),
}));

vi.mock("../PostsGrid/PostsGrid", () => ({
  PostsGrid: () => <div>posts grid</div>,
}));

describe("Posts", () => {
  it("renders server-provided posts on mount without refetching", async () => {
    vi.mocked(getContent).mockResolvedValue({
      postCollection: {
        total: 1,
        items: [],
      },
    });

    render(
      <Posts
        totalPages={1}
        initialPosts={[]}
        rootFilter={{ type_in: ["newsletter"] }}
      />,
    );

    await waitFor(() => expect(getContent).not.toHaveBeenCalled());
  });
});
