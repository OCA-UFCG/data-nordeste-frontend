import { render, screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReportBuilder } from "./ReportBuilder";

/** Serves the places list only at its real path, so a renamed fetch URL fails the test. */
class FakeCitiesApi {
  constructor(private readonly areas: string[] = []) {}

  fetch = async (input: RequestInfo | URL): Promise<Response> =>
    input.toString().endsWith("/api/reports/cities")
      ? Response.json({
          states: ["Alagoas", "Bahia"],
          areas: this.areas,
          cities: ["Campina Grande", "João Pessoa"],
        })
      : new Response("Not Found", { status: 404 });
}

// The areas Automatic-Reporting `/areas` lists (12/11/2026), in its order.
const BACKEND_AREAS = [
  "Caatinga",
  "Área de atuação da Sudene",
  "Semiárido",
  "Nordeste",
];

const DEMOGRAFIA_THEME = {
  id: "demografia",
  name: "Demografia",
  color: "#018F39",
  sys: { id: "demografia-sys" },
};

const DESENVOLVIMENTO_SOCIAL_THEME = {
  id: "desenvolvimento_social",
  name: "Desenvolvimento Social",
  color: "#4D2B85",
  sys: { id: "desenvolvimento-social-sys" },
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

// Choosing a territory collapses the other step; open it only when closed,
// since clicking an open accordion step would close it.
async function openReportStep(user: UserEvent, title: RegExp): Promise<void> {
  const step = screen.getByRole("button", { name: title });
  if (step.getAttribute("aria-expanded") === "false") await user.click(step);
}

// "Município" offers every theme, so it is where a test selects all of them.
async function selectEveryThemeAsMunicipality(user: UserEvent): Promise<void> {
  await chooseScope(user, "Município");
  await openReportStep(user, /Selecione os temas/);
  await user.click(screen.getByRole("button", { name: "Selecionar todos" }));
}

const INSTRUMENTOS_SUDENE_THEME = {
  id: "instrumentos_sudene",
  name: "Instrumentos Sudene",
  color: "#00A5CF",
  sys: { id: "instrumentos-sudene-sys" },
};

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

  it("offers only Município and Estado when the backend lists no area", async () => {
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

  it("offers the area scopes in the Figma groups when the backend lists them", async () => {
    vi.stubGlobal("fetch", new FakeCitiesApi(BACKEND_AREAS).fetch);
    const user = userEvent.setup();

    render(<ReportBuilder themes={[]} />);
    await user.click(screen.getByRole("button", { name: /^Recorte:/ }));

    // The places arrive after the first render; the open menu re-renders with them.
    await screen.findByText("Recortes estratégicos");

    const scopeNames = screen
      .getAllByRole("radio")
      .map((radio) => radio.getAttribute("value"));
    expect(scopeNames).toEqual([
      "municipio",
      "estado",
      "nordeste",
      "caatinga",
      "semiarido",
      "area-sudene",
    ]);
  });

  it("takes an area scope as the territory, with no search, and opens the theme step", async () => {
    vi.stubGlobal("fetch", new FakeCitiesApi(BACKEND_AREAS).fetch);
    const user = userEvent.setup();

    render(<ReportBuilder themes={[]} />);
    await user.click(screen.getByRole("button", { name: /^Recorte:/ }));
    await user.click(await screen.findByRole("radio", { name: /Caatinga/ }));

    expect(screen.queryByPlaceholderText(/Pesquise/)).not.toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Selecione os temas/ }),
      ).toHaveAttribute("aria-expanded", "true"),
    );
  });

  it("disables and unselects the themes without area data in an area scope", async () => {
    vi.stubGlobal("fetch", new FakeCitiesApi(BACKEND_AREAS).fetch);
    const user = userEvent.setup();

    render(
      <ReportBuilder
        themes={[DEMOGRAFIA_THEME, DESENVOLVIMENTO_SOCIAL_THEME]}
      />,
    );
    await screen.findByRole("button", { name: /^Recorte:/ });
    await selectEveryThemeAsMunicipality(user);
    await openReportStep(user, /Área de Interesse/);
    await user.click(screen.getByRole("button", { name: /^Recorte:/ }));
    await user.click(await screen.findByRole("radio", { name: /Caatinga/ }));
    await openReportStep(user, /Selecione os temas/);

    const social = screen.getByRole("checkbox", {
      name: "Desenvolvimento Social",
    });
    expect(social).toBeDisabled();
    expect(social).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Demografia" })).toBeChecked();
  });

  it("disables and unselects Instrumentos Sudene under Estado", async () => {
    vi.stubGlobal("fetch", new FakeCitiesApi().fetch);
    const user = userEvent.setup();

    render(
      <ReportBuilder themes={[DEMOGRAFIA_THEME, INSTRUMENTOS_SUDENE_THEME]} />,
    );
    await selectEveryThemeAsMunicipality(user);
    await openReportStep(user, /Área de Interesse/);
    await chooseScope(user, "Estado");
    await openReportStep(user, /Selecione os temas/);

    const instrumentos = screen.getByRole("checkbox", {
      name: "Instrumentos Sudene",
    });
    expect(instrumentos).toBeDisabled();
    expect(instrumentos).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Demografia" })).toBeChecked();
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
