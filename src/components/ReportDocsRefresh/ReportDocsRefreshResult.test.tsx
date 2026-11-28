import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReportDocsRefreshResult } from "./ReportDocsRefreshResult";

describe("ReportDocsRefreshResult", () => {
  it("lists the Docs that kept the previous text, with the rule that blocked them", () => {
    render(
      <ReportDocsRefreshResult
        outcome={{
          kind: "concluido",
          docs: [
            { label: "saude", status: "atualizado", warnings: [] },
            {
              label: "saude (área)",
              status: "com_problema",
              warnings: ["Para quando $base for igual a municipios"],
            },
          ],
        }}
      />,
    );

    expect(screen.getByText(/1 de 2 documentos atualizados/)).toBeTruthy();
    expect(screen.getByText("saude (área)")).toBeTruthy();
    expect(
      screen.getByText("Para quando $base for igual a municipios"),
    ).toBeTruthy();
    expect(screen.queryByText(/^saude $/)).toBeNull();
  });

  it("shows no blocked list when every Doc was updated", () => {
    render(
      <ReportDocsRefreshResult
        outcome={{
          kind: "concluido",
          docs: [{ label: "saude", status: "atualizado", warnings: [] }],
        }}
      />,
    );

    expect(screen.queryByText(/não foram atualizados/)).toBeNull();
  });

  it("explains a refresh already in progress", () => {
    render(<ReportDocsRefreshResult outcome={{ kind: "em-andamento" }} />);

    expect(screen.getByRole("status").textContent).toContain(
      "Já tem uma atualização dos relatórios em andamento",
    );
  });
});
