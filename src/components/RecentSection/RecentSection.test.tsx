import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RecentSection } from "./RecentSection";
import { IPublication } from "@/utils/interfaces";
import type { RecentPostsByTab } from "@/features/home/recentPosts";

vi.mock("@/components/CardCarousel/CardCarousel", () => ({
  CardCarousel: ({ items }: { items: IPublication[] }) => (
    <div>
      {items.map((item) => (
        <article key={item.title}>{item.title}</article>
      ))}
    </div>
  ),
}));

const initialPosts = [
  {
    title: "Publicação inicial",
    link: "/posts/inicial",
    thumb: { url: "/thumb.png" },
    type: "newsletter",
    date: "2024-01-01",
  },
] satisfies IPublication[];

const panelPosts = [
  {
    title: "Painel atualizado",
    link: "/panel",
    thumb: { url: "/panel.png" },
    type: "data-panel",
    date: "2024-02-01",
  },
] satisfies IPublication[];

const storyPosts = [
  {
    title: "Narrativa atualizada",
    link: "/data-stories/historia",
    thumb: { url: "/story.png" },
    type: "data-story",
    date: "2024-03-01",
  },
] satisfies IPublication[];

const newsletterPosts = [
  {
    title: "Boletim atualizado",
    link: "/posts/boletim",
    thumb: { url: "/newsletter.png" },
    type: "newsletter",
    date: "2024-04-01",
  },
] satisfies IPublication[];

const postsByTab = {
  all: initialPosts,
  panels: panelPosts,
  stories: storyPosts,
  newsletters: newsletterPosts,
  publications: [...storyPosts, ...newsletterPosts],
} satisfies RecentPostsByTab;

const renderRecentSection = () =>
  render(
    <RecentSection
      header={{ id: "new", title: "Recentes", subtitle: "Últimos itens" }}
      content={initialPosts}
      postsByTab={postsByTab}
    />,
  );

const expectNoBrowserFetch = (fetchSpy: ReturnType<typeof vi.fn>) => {
  expect(fetchSpy).not.toHaveBeenCalled();
  expect(
    screen.getAllByRole("link", { name: /Ver Todos/i })[0],
  ).toHaveAttribute("href", "/explore?page=1");
};

describe("RecentSection", () => {
  it("links all recent items to the explore page before a type is selected", () => {
    renderRecentSection();

    expect(screen.getByText("Publicação inicial")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Ver Todos/i })[0],
    ).toHaveAttribute("href", "/explore?page=1");
  });

  it.each([
    ["Painéis", "Painel atualizado"],
    ["Narrativas", "Narrativa atualizada"],
    ["Boletins", "Boletim atualizado"],
  ])(
    "shows the preloaded %s tab without calling Contentful",
    async (tabLabel, expectedTitle) => {
      const fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);
      renderRecentSection();

      await userEvent.click(screen.getByLabelText(tabLabel));

      expect(screen.getByText(expectedTitle)).toBeInTheDocument();
      expect(screen.queryByText("Publicação inicial")).not.toBeInTheDocument();
      expectNoBrowserFetch(fetchSpy);
      vi.unstubAllGlobals();
    },
  );
});
