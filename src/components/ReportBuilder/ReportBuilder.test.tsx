import { render, screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReportBuilder } from "./ReportBuilder";

/** Serves the places list only at its real path, so a renamed fetch URL fails the test. */
class FakeCitiesApi {
  fetch = async (input: RequestInfo | URL): Promise<Response> =>
    input.toString().endsWith("/api/reports/cities")
      ? Response.json({
          states: ["Alagoas", "Bahia"],
          cities: ["Campina Grande", "João Pessoa"],
        })
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

async function chooseScope(user: UserEvent, label: string): Promise<void> {
  await user.click(screen.getByRole("button", { name: /^Recorte:/ }));
  await user.click(screen.getByRole("radio", { name: new RegExp(label) }));
}

const MUNICIPALITY_PLACEHOLDER = "Pesquise ou selecione um município";

describe("ReportBuilder", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens the theme step after a municipality is selected from suggestions", async () => {
    const citiesApi = new FakeCitiesApi();
    vi.stubGlobal("fetch", citiesApi.fetch);
    const user = userEvent.setup();

    render(<ReportBuilder themes={[]} />);
    await chooseScope(user, "Município");

    const municipalitySearch = screen.getByPlaceholderText(
      MUNICIPALITY_PLACEHOLDER,
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
      screen.getByRole("button", { name: /Área de Interesse/ }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("suggests accented municipalities when typing without accents", async () => {
    const citiesApi = new FakeCitiesApi();
    vi.stubGlobal("fetch", citiesApi.fetch);
    const user = userEvent.setup();

    render(<ReportBuilder themes={[]} />);
    await chooseScope(user, "Município");

    const municipalitySearch = screen.getByPlaceholderText(
      MUNICIPALITY_PLACEHOLDER,
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
    await chooseScope(user, "Município");

    const municipalitySearch = screen.getByPlaceholderText(
      MUNICIPALITY_PLACEHOLDER,
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

  it("lists only states in the territory search after choosing Estado", async () => {
    const citiesApi = new FakeCitiesApi();
    vi.stubGlobal("fetch", citiesApi.fetch);
    const user = userEvent.setup();

    render(<ReportBuilder themes={[]} />);
    await chooseScope(user, "Estado");
    await user.click(
      screen.getByPlaceholderText("Pesquise ou selecione um estado"),
    );

    expect(
      await screen.findByRole("option", { name: "Alagoas" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Campina Grande" }),
    ).not.toBeInTheDocument();
  });

  it("offers only Município and Estado as scopes", async () => {
    vi.stubGlobal("fetch", new FakeCitiesApi().fetch);
    const user = userEvent.setup();

    render(<ReportBuilder themes={[]} />);
    await user.click(screen.getByRole("button", { name: /^Recorte:/ }));

    const scopeNames = screen
      .getAllByRole("radio")
      .map((radio) => radio.getAttribute("value"));
    expect(scopeNames).toEqual(["municipio", "estado"]);
    expect(screen.queryByText("Recortes estratégicos")).not.toBeInTheDocument();
  });

  it("clears the chosen territory when the scope changes", async () => {
    vi.stubGlobal("fetch", new FakeCitiesApi().fetch);
    const user = userEvent.setup();

    render(<ReportBuilder themes={[]} />);
    await chooseScope(user, "Município");
    await user.type(
      screen.getByPlaceholderText(MUNICIPALITY_PLACEHOLDER),
      "campina",
    );
    await chooseScope(user, "Estado");

    expect(
      screen.getByPlaceholderText("Pesquise ou selecione um estado"),
    ).toHaveValue("");
  });
});
