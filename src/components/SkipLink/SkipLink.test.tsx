import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MAIN_CONTENT_ID, SkipLink } from "./SkipLink";

describe("SkipLink", () => {
  it("points to the main landmark that HubTemplate renders", () => {
    render(<SkipLink />);

    expect(
      screen.getByRole("link", { name: "Pular para o conteúdo principal" }),
    ).toHaveAttribute("href", `#${MAIN_CONTENT_ID}`);
  });

  it("stays visually hidden until it receives keyboard focus", () => {
    render(<SkipLink />);

    const link = screen.getByRole("link");

    expect(link).toHaveClass("sr-only", "focus:not-sr-only");
  });
});
