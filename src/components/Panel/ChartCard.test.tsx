import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChartCard } from "@/components/Panel/ChartCard";

const TABLE = {
  caption: "VAB por setor",
  columns: ["Setor", "VAB"] as [string, string],
  rows: [["Serviços", "R$ 493,42 Bi"]] as [string, string][],
};

describe("ChartCard", () => {
  it("switches between the chart and its table", () => {
    render(
      <ChartCard title="VAB por setor" table={TABLE}>
        <p>gráfico</p>
      </ChartCard>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Ver tabela" }));

    expect(screen.queryByText("gráfico")).not.toBeInTheDocument();
    expect(
      screen.getByRole("rowheader", { name: "Serviços" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ver gráfico" }));

    expect(screen.getByText("gráfico")).toBeInTheDocument();
  });

  it("has no toggle without a table", () => {
    render(<ChartCard title="Mapa">x</ChartCard>);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
