import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InfoTooltip } from "./InfoTooltip";

describe("InfoTooltip", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens on hover and renders the configured content", async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <InfoTooltip
        label="Saiba mais sobre painéis de dados"
        title="Saiba mais"
        description="Um painel permite a interatividade e exploração dos dados de maneira dinâmica."
        href="/explore"
        ctaLabel="Explore aqui o Panorama da Educação Regional"
      />,
    );

    expect(screen.queryByText("Saiba mais")).not.toBeInTheDocument();

    await user.hover(screen.getByRole("button", { name: /Saiba mais/i }));

    expect(screen.getByText("Saiba mais")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Um painel permite a interatividade e exploração dos dados de maneira dinâmica.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Explore aqui o Panorama da Educação Regional",
      }),
    ).toHaveAttribute("href", "/explore");

    await user.unhover(screen.getByRole("button", { name: /Saiba mais/i }));
    vi.advanceTimersByTime(130);

    await waitFor(() => {
      expect(screen.queryByText("Saiba mais")).not.toBeInTheDocument();
    });
  });
});
