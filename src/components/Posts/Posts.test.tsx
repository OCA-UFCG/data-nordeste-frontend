import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Posts } from "./Posts";
import { IPublication } from "@/utils/interfaces";

const searchParams = { current: new URLSearchParams("page=1") };

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams.current,
}));

vi.mock("../PostsGrid/PostsGrid", () => ({
  PostsGrid: ({
    posts,
    currentPage,
  }: {
    posts: IPublication[];
    currentPage: number;
  }) => (
    <div>
      <span>página {currentPage}</span>
      {posts.map((post) => (
        <article key={post.title}>{post.title}</article>
      ))}
    </div>
  ),
}));

const post = (title: string) =>
  ({
    title,
    link: `/posts/${title}`,
    thumb: { url: "/thumb.png" },
    type: "newsletter",
    date: "2024-01-01",
  }) satisfies IPublication;

describe("Posts", () => {
  it("shows the page the server rendered after a pagination link", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { rerender } = render(
      <Posts totalPages={2} posts={[post("Boletim da página 1")]} />,
    );

    searchParams.current = new URLSearchParams("page=2");
    rerender(<Posts totalPages={2} posts={[post("Boletim da página 2")]} />);

    expect(screen.getByText("Boletim da página 2")).toBeInTheDocument();
    expect(screen.getByText("página 2")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
