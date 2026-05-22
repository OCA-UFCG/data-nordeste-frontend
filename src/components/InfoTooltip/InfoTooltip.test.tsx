import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { InfoTooltip } from "./InfoTooltip";

describe("InfoTooltip", () => {
  it("opens on hover and renders the configured content", async () => {
    const user = userEvent.setup();

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

    await waitFor(() => {
      expect(screen.queryByText("Saiba mais")).not.toBeInTheDocument();
    });
  });

  it("stays closed after clicking the close button", async () => {
    const user = userEvent.setup();

    render(
      <InfoTooltip
        label="Saiba mais sobre narrativas de dados"
        title="Saiba mais"
        description="Narrativas de dados apresentam análises guiadas."
      />,
    );

    await user.hover(screen.getByRole("button", { name: /Saiba mais/i }));

    expect(
      screen.getByText("Narrativas de dados apresentam análises guiadas."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Fechar informação" }));

    await waitFor(() => {
      expect(
        screen.queryByText("Narrativas de dados apresentam análises guiadas."),
      ).not.toBeInTheDocument();
    });
  });
});
