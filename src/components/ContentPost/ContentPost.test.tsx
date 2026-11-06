import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { IPublication } from "@/utils/interfaces";
import ContentPost from "./ContentPost";

const buildPost = (link: string | null): IPublication =>
  ({
    title: "Monitor de seca",
    type: "data-panel",
    link,
    date: "2026-11-06T00:00:00.000-03:00",
    thumb: { url: "" },
    sys: { id: "3O7Ylnbn2nk0myHMqMAGIX" },
  }) as unknown as IPublication;

describe("ContentPost", () => {
  it("links the card to the post destination", () => {
    render(<ContentPost content={buildPost("https://example.org/painel")} />);

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://example.org/painel",
    );
    expect(screen.getByText("Acessar")).toBeInTheDocument();
  });

  // Regression: a Contentful draft without link broke the prerender of "/".
  it("renders an unclickable card when the post has no link", () => {
    render(<ContentPost content={buildPost(null)} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Monitor de seca")).toBeInTheDocument();
    expect(screen.getByText("Link indisponível")).toBeInTheDocument();
  });
});
