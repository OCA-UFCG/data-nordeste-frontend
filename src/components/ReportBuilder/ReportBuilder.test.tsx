import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReportBuilder } from "./ReportBuilder";

/** Serves the places list only at its real path, so a renamed fetch URL fails the test. */
class FakeCitiesApi {
  fetch = async (input: RequestInfo | URL): Promise<Response> =>
    input.toString().endsWith("/api/reports/cities")
      ? Response.json({ states: [], cities: ["Campina Grande", "João Pessoa"] })
      : new Response("Not Found", { status: 404 });
}

const DEMOGRAFIA_THEME = {
  id: "demografia",
  name: "Demografia",
  color: "#018F39",
  sys: { id: "demografia-sys" },
};

/** Serves the cities list and answers the generation POST with a fixed status, mimicking the backend behind `aguardar=nao`. */
class FakeReportGenerationApi {
  constructor(private readonly generateStatus: number) {}

  fetch = async (input: RequestInfo | URL): Promise<Response> => {
    const url = input.toString();
    if (url.includes("/api/reports/cities")) {
      return Response.json({ states: [], cities: ["Campina Grande"] });
    }

    return new Response(null, {
      status: this.generateStatus,
      headers: { "Retry-After": "30" },
    });
  };
}

describe("ReportBuilder", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens the theme step after a municipality is selected from suggestions", async () => {
    const citiesApi = new FakeCitiesApi();
    vi.stubGlobal("fetch", citiesApi.fetch);
    const user = userEvent.setup();

    render(<ReportBuilder themes={[]} />);

    const municipalitySearch = screen.getByPlaceholderText(
      "Pesquise o município ou estado",
    );
    await user.type(municipalitySearch, "campina");

    const suggestion = await screen.findByRole("option", {
      name: "Campina Grande",
    });
    await user.click(suggestion);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Selecione os temas/ }),
      ).toHaveAttribute("aria-expanded", "true"),
    );
    expect(
      screen.getByRole("button", { name: /Selecione o município ou estado/ }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("suggests accented municipalities when typing without accents", async () => {
    const citiesApi = new FakeCitiesApi();
    vi.stubGlobal("fetch", citiesApi.fetch);
    const user = userEvent.setup();

    render(<ReportBuilder themes={[]} />);

    const municipalitySearch = screen.getByPlaceholderText(
      "Pesquise o município ou estado",
    );
    await user.type(municipalitySearch, "joao");

    expect(
      await screen.findByRole("option", { name: "João Pessoa" }),
    ).toBeInTheDocument();
  });

  it("shows the busy message when the generation proxy answers 503, not the generic timeout message", async () => {
    const reportApi = new FakeReportGenerationApi(503);
    vi.stubGlobal("fetch", reportApi.fetch);
    const user = userEvent.setup();

    render(<ReportBuilder themes={[DEMOGRAFIA_THEME]} />);

    const municipalitySearch = screen.getByPlaceholderText(
      "Pesquise o município ou estado",
    );
    await user.type(municipalitySearch, "campina");
    await user.click(
      await screen.findByRole("option", { name: "Campina Grande" }),
    );
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Gerar relatório/ }));

    expect(
      await screen.findByText(
        "O gerador está ocupado no momento. Tente novamente em instantes.",
      ),
    ).toBeInTheDocument();
  });
});
