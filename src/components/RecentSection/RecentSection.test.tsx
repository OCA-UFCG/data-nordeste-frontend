import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RecentSection } from "./RecentSection";
import { getContent } from "@/utils/contentful";
import { IPublication } from "@/utils/interfaces";

vi.mock("@/utils/contentful", () => ({
  getContent: vi.fn(),
}));

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
    description: "",
  },
] satisfies IPublication[];

const panelPosts = [
  {
    title: "Painel atualizado",
    link: "/panel",
    thumb: { url: "/panel.png" },
    type: "data-panel",
    date: "2024-02-01",
    description: "",
  },
] satisfies IPublication[];

const storyPosts = [
  {
    title: "Narrativa atualizada",
    link: "/data-stories/historia",
    thumb: { url: "/story.png" },
    type: "data-story",
    date: "2024-03-01",
    description: "",
  },
] satisfies IPublication[];

const newsletterPosts = [
  {
    title: "Boletim atualizado",
    link: "/posts/boletim",
    thumb: { url: "/newsletter.png" },
    type: "newsletter",
    date: "2024-04-01",
    description: "",
  },
] satisfies IPublication[];

describe("RecentSection", () => {
  it("links all recent items to the explore page before a type is selected", () => {
    render(
      <RecentSection
        header={{ id: "new", title: "Recentes", subtitle: "Últimos itens" }}
        content={initialPosts}
      />,
    );

    expect(
      screen.getAllByRole("link", { name: /Ver Todos/i })[0],
    ).toHaveAttribute("href", "/explore?page=1");
  });

  it("fetches filtered posts and updates the all-posts link when type changes", async () => {
    vi.mocked(getContent).mockResolvedValue({
      postCollection: { items: panelPosts },
    });

    render(
      <RecentSection
        header={{ id: "new", title: "Recentes", subtitle: "Últimos itens" }}
        content={initialPosts}
      />,
    );

    expect(screen.getByText("Publicação inicial")).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Painéis"));

    await waitFor(() => {
      expect(screen.getByText("Painel atualizado")).toBeInTheDocument();
    });
    expect(getContent).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        limit: 12,
        filter: { type_in: ["data-panel"] },
      }),
    );
    expect(
      screen.getAllByRole("link", { name: /Ver Todos/i })[0],
    ).toHaveAttribute("href", "/explore?page=1");
  });

  it("fetches only narratives when the narratives filter is selected", async () => {
    vi.mocked(getContent).mockResolvedValue({
      postCollection: { items: storyPosts },
    });

    render(
      <RecentSection
        header={{ id: "new", title: "Recentes", subtitle: "Últimos itens" }}
        content={initialPosts}
      />,
    );

    await userEvent.click(screen.getByLabelText("Narrativas"));

    await waitFor(() => {
      expect(screen.getByText("Narrativa atualizada")).toBeInTheDocument();
    });
    expect(getContent).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        limit: 12,
        filter: { type_in: ["data-story"] },
      }),
    );
    expect(
      screen.getAllByRole("link", { name: /Ver Todos/i })[0],
    ).toHaveAttribute("href", "/explore?page=1");
  });

  it("fetches only newsletters when the newsletters filter is selected", async () => {
    vi.mocked(getContent).mockResolvedValue({
      postCollection: { items: newsletterPosts },
    });

    render(
      <RecentSection
        header={{ id: "new", title: "Recentes", subtitle: "Últimos itens" }}
        content={initialPosts}
      />,
    );

    await userEvent.click(screen.getByLabelText("Boletins"));

    await waitFor(() => {
      expect(screen.getByText("Boletim atualizado")).toBeInTheDocument();
    });
    expect(getContent).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        limit: 12,
        filter: { type_in: ["newsletter"] },
      }),
    );
    expect(
      screen.getAllByRole("link", { name: /Ver Todos/i })[0],
    ).toHaveAttribute("href", "/explore?page=1");
  });
});
