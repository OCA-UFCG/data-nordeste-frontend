import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReportBuilder } from "./ReportBuilder";

class FakeCitiesApi {
  fetch = async (): Promise<Response> =>
    new Response(JSON.stringify(["Campina Grande", "João Pessoa"]), {
      status: 200,
    });
}

describe("ReportBuilder", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens the theme step after a municipality is selected", async () => {
    const citiesApi = new FakeCitiesApi();
    vi.stubGlobal("fetch", citiesApi.fetch);
    const user = userEvent.setup();

    render(<ReportBuilder themes={[]} />);

    const municipalitySearch = screen.getByPlaceholderText(
      "Pesquise o município",
    );
    await waitFor(() => {
      expect(
        document.querySelector('option[value="Campina Grande"]'),
      ).toBeInTheDocument();
    });

    await user.type(municipalitySearch, "Campina Grande");

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Selecione os temas/ }),
      ).toHaveAttribute("aria-expanded", "true"),
    );
    expect(
      screen.getByRole("button", { name: /Selecione o município/ }),
    ).toHaveAttribute("aria-expanded", "false");
  });
});
